// --------------- UNDO MANAGER ----------------------

/*global Backbone:true */

var UndoManager = Backbone.Model.extend({
    defaults: function(){
        return {
            undo_pointer: -1
        };
    },
    initialize: function() {
        this.undoQueue = [];
        this.undoInProgress = false;
        //this.undo_pointer = -1;
    },
    canUndo: function() {
        return this.get('undo_pointer') >= 0;
    },
    undo: function() {
        var pointer = this.get('undo_pointer');
        if (pointer < 0) {
            return;
        }
        this.undoQueue[pointer].undo();
        this.set('undo_pointer',pointer-1); // trigger change
    },
    canRedo: function() {
        return this.get('undo_pointer')+1 < this.undoQueue.length;
    },
    redo: function() {
        var pointer = this.get('undo_pointer');
        if (pointer+1 >= this.undoQueue.length) {
            return;
        }
        this.undoQueue[pointer+1].redo();
        this.set('undo_pointer', pointer+1); // trigger change event
    },
    postEdit: function(undo) {
        var pointer = this.get('undo_pointer');
        // remove any undo ahead of current position
        if (this.undoQueue.length > pointer+1) {
            this.undoQueue = this.undoQueue.slice(0, pointer+1);
        }
        this.undoQueue.push(undo);
        this.set('undo_pointer', pointer+1); // trigger change event
    },

    listenToCollection: function(collection) {
        var self = this;
        collection.on('add', function(m) {
            self.addListener(m);
        });
    },

    addListener: function(model) {
        var self = this;
        model.on("change", function(m) {
            if (self.undoInProgress) {
                return;     // Don't undo the undo!
            }

            var undo_attrs = {},
                redo_attrs = {},
                a;
            for (a in m.changed) {
                if (a != "selected") {
                    undo_attrs[a] = m.previous(a);
                    redo_attrs[a] = m.get(a);
                }
            }
            if (_.size(redo_attrs) == 0) {
                return;
            }

            self.postEdit( {
                name: "Undo...",
                undo: function() {
                    self.undoInProgress = true;
                    m.save(undo_attrs);
                    self.undoInProgress = false;
                },
                redo: function() {
                    self.undoInProgress = true;
                    m.save(redo_attrs);
                    self.undoInProgress = false;
                }
            });
        });
    }
});

var UndoView = Backbone.View.extend({
    
    el: $("#undoControls"),
    
    events: {
      "click .undo": "undo",
      "click .redo": "redo"
    },
    
    initialize: function() {
        this.$el = $("#undoControls");
      this.model.on('change', this.render, this);
      this.undoBtn = this.$(".undo");
      this.redoBtn = this.$(".redo");
      this.render();
    },
    
    render: function() {
        //this.$el.html("<button class='undo'>Undo</button>");
        this.undoBtn.attr('disabled', !this.model.canUndo());
        this.redoBtn.attr('disabled', !this.model.canRedo());
        return this;
    },
    
    undo: function() {
        this.model.undo();
    },
    redo: function() {
        this.model.redo();
    }
});