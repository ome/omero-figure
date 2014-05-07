
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

    isVisible: function(filter) {
        if (filter.owner) {
            if (this.get('ownerFullName') !== filter.owner) {
                return false;
            }
        }
        if (filter.name) {
            if (this.get('name').toLowerCase().indexOf(filter.name) < 0) {
                return false;
            }
        }
        return true;
    }
});


var FileList = Backbone.Collection.extend({

    model: FigureFile,

    comparator: 'creationDate',

    initialize: function() {
    },

    disable: function(fileId) {
        // enable all first
        this.where({disabled: true}).forEach(function(f){
            f.set('disabled', false);
        });

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
        this.$fileFilter = $('#file-filter');
        var self = this;
        this.model.bind("remove sort", this.render, this);
        this.model.bind("add", function (file) {
            var e = new FileListItemView({model:file}).el;
            self.$tbody.prepend(e);
        });
        this.$fileFilter.val("");
    },

    events: {
        "click .sort-created": "sort_created",
        "click .sort-created-reverse": "sort_created_reverse",
        "click .sort-name": "sort_name",
        "click .sort-name-reverse": "sort_name_reverse",
        "click .pick-owner": "pick_owner",
        "keyup #file-filter": "filter_files",
    },

    filter_files: function(event) {
        this.render();
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

    pick_owner: function(event) {
        event.preventDefault()
        var owner = $(event.target).text();
        if (owner != " -- Show All -- ") {
            this.owner = owner;
        } else {
            delete this.owner;
        }
        this.render();
    },

    render:function () {
        var self = this,
            filter = {},
            filterVal = this.$fileFilter.val();
        if (this.owner) {
            filter.owner = this.owner;
        }
        if (filterVal.length > 0) {
            filter.name = filterVal.toLowerCase();
        }
        this.$tbody.empty();
        if (this.model.models.length === 0) {
            var msg = "<tr><td colspan='3'>" +
                "You have no figures. Start by <a href='#new'>creating a new figure</a>" +
                "</td></tr>";
            self.$tbody.html(msg);
        }
        _.each(this.model.models, function (file) {
            if (file.isVisible(filter)) {
                var e = new FileListItemView({model:file}).render().el;
                self.$tbody.prepend(e);
            }
        });
        owners = this.model.pluck("ownerFullName");
        owners = _.uniq(owners, false);
        var ownersHtml = "<li><a class='pick-owner' href='#'> -- Show All -- </a></li>";
            ownersHtml += "<li class='divider'></li>";
        _.each(owners, function(owner) {
            ownersHtml += "<li><a class='pick-owner' href='#'>" + owner + "</a></li>";
        });
        $("#owner-menu").html(ownersHtml);
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
        var d = new Date(secs * 1000),
            s = d.toISOString();        // "2014-02-26T23:09:09.415Z"
        s = s.replace("T", " ");
        s = s.substr(0, 16);
        return s;
    },

    formatName: function(name) {
        // add spaces so we can wrap really long names
        var length = 60;
        if (name.length > length) {
            // split into chunks and join with space
            name = name.match(/.{1,60}/g).join(" ");
        }
        return name;
    },

    render:function () {
        var json = this.model.toJSON(),
            baseUrl = json.baseUrl;
        baseUrl = baseUrl || WEBGATEWAYINDEX.slice(0, -1);  // remove last /
        json.thumbSrc = baseUrl + "/render_thumbnail/" + json.imageId + "/";
        json.formatName = this.formatName;
        json.formatDate = this.formatDate;
        var h = this.template(json);
        $(this.el).html(h);
        return this;
    }

});