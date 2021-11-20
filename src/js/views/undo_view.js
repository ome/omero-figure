
var UndoView = Backbone.View.extend({

    el: $("#edit_actions"),

    events: {
        "click .undo": "undo",
        "click .redo": "redo"
    },

    // NB: requires backbone.mousetrap
    keyboardEvents: {
        'mod+z': 'undo',
        'mod+y': 'redo'
    },

    initialize: function () {
        this.model.on('change', this.render, this);
        this.undoEl = $(".undo", this.$el);
        this.redoEl = $(".redo", this.$el);

        this.render();
    },

    render: function () {
        if (this.model.canUndo()) {
            this.undoEl.removeClass('disabled');
        } else {
            this.undoEl.addClass('disabled');
        }
        if (this.model.canRedo()) {
            this.redoEl.removeClass('disabled');
        } else {
            this.redoEl.addClass('disabled');
        }
        return this;
    },

    // If modal dialags are visible, we want to ignore undo/redo
    modal_visible: function () {
        return $("div.modal:visible").length > 0;
    },

    undo: function (event) {
        event.preventDefault();
        if (this.modal_visible()) return;
        this.model.undo();
    },
    redo: function (event) {
        event.preventDefault();
        if (this.modal_visible()) return;
        this.model.redo();
    }
});
