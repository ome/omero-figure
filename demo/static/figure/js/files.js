
var FigureFile = Backbone.Model.extend({

    defaults: {
        disabled: false,
    },

    initialize: function() {

        var desc = this.get('description');
        if (desc && desc.imageId) {
            this.set('imageId', desc.imageId);
        } else {
            this.set('imageId', 0);
        }
        if (desc && desc.baseUrl) {
            this.set('baseUrl', desc.baseUrl);
        }
    },
});


var FileList = Backbone.Collection.extend({

    model: FigureFile,

    comparator: 'creationDate',

    initialize: function() {
    },

    disable: function(fileId) {
        var f = this.get(fileId);
        if (f) {
            f.set('disabled', true);
        }
    },

    deleteFile: function(fileId, name) {
        // may not have fetched files...
        var f = this.get(fileId),   // might be undefined
            msg = "Delete '" + name + "'?",
            self = this;
        if (confirm(msg)) {
            $.post( DELETE_WEBFIGURE_URL, { fileId: fileId })
                .done(function(){
                    self.remove(f);
                    app.navigate("", {trigger: true});
                });
        }
    },

    url: function() {
        return LIST_WEBFIGURES_URL;
    }
});


var FileListView = Backbone.View.extend({

    el: $("#figure_files"),

    initialize:function () {
        this.$tbody = $('tbody', this.$el);
        var self = this;
        this.model.bind("reset remove sync sort", this.render, this);
        this.model.bind("add", function (file) {
            var e = new FileListItemView({model:file}).render().el;
            self.$tbody.prepend(e);
        });
    },

    events: {
        "click .sort-created": "sort_created",
        "click .sort-created-reverse": "sort_created_reverse",
        "click .sort-name": "sort_name",
        "click .sort-name-reverse": "sort_name_reverse",
    },

    sort_created: function(event) {
        this.render_sort_btn(event);
        this.model.comparator = 'creationDate';
        this.model.sort();
    },

    sort_created_reverse: function(event) {
        this.render_sort_btn(event);
        this.model.comparator = function(left, right) {
            var l = left.get('creationDate'),
                r = right.get('creationDate');
            return l < r ? 1 : l > r ? -1 : 0;
        };
        this.model.sort();
    },

    sort_name: function(event) {
        this.render_sort_btn(event);
        this.model.comparator = 'name';
        this.model.sort();
    },

    sort_name_reverse: function(event) {
        this.render_sort_btn(event);
        this.model.comparator = function(left, right) {
            var l = left.get('name'),
                r = right.get('name');
            return l < r ? 1 : l > r ? -1 : 0;
        };
        this.model.sort();
    },

    render_sort_btn: function(event) {
        $("th .btn", this.$el).addClass('muted');
        $(event.target).removeClass('muted');
    },

    render:function () {
        var self = this;
        this.$tbody.empty();
        if (this.model.models.length === 0) {
            var msg = "<tr><td colspan='3'>" +
                "You have no figures. Start by <a href='#new'>creating a new figure</a>" +
                "</td></tr>";
            self.$tbody.html(msg);
        }
        _.each(this.model.models, function (file) {
            var e = new FileListItemView({model:file}).render().el;
            self.$tbody.prepend(e);
        });
        return this;
    }
});

var FileListItemView = Backbone.View.extend({

    tagName:"tr",

    template: _.template($('#figure_file_item').html()),

    initialize:function () {
        this.model.bind("change", this.render, this);
        this.model.bind("destroy", this.close, this);
    },

    events: {
        "click a": "hide_file_chooser"
    },

    hide_file_chooser: function() {
        $("#openFigureModal").modal('hide');
    },

    formatDate: function(secs) {
        return secs;    // Don't need to format
        var d = new Date(secs * 1000),
            s = d.toISOString();        // "2014-02-26T23:09:09.415Z"
        s = s.replace("T", " ");
        s = s.substr(0, 16);
        return s;
    },

    render:function () {
        var json = this.model.toJSON(),
            baseUrl = json.baseUrl || "/webgateway";
        json.thumbSrc = baseUrl + "/render_thumbnail/" + json.imageId + "/";
        json.formatDate = this.formatDate;
        var h = this.template(json);
        $(this.el).html(h);
        return this;
    }

});