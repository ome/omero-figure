
// Events, show/hide and rendering for various Modal dialogs.
import Backbone from "backbone";
import _ from "underscore";
import $ from "jquery";

import FigureModel from "../models/figure_model";
import { hideModal } from "./util";

export const OpenLocalFileModalView = Backbone.View.extend({

    el: $("#openLocalFileModal"),

    model: FigureModel,

    initialize: function(options) {

        this.app = options.app;
    
        // TEMP? show a default file to open
        let demoUrl = "https://gist.githubusercontent.com/will-moore/fe0e260544b46af6e1e523b288fc85bc/raw/30547e61d4d8753ef0016f0a70435f1aafb43c2f/OMERO.figure_NGFF_demo.json";
        $(".figureFileUrl", this.el).val(demoUrl);
        this.enableSubmit();

        // when dialog is shown, clear and render
        // document.getElementById('openLocalFileModal').addEventListener('shown.bs.modal', () => {
            // self.render();
        //});
    },

    events: {
        "submit .openLocalFileForm": "handleOpenFile",
        "input .figureFileUrl": "enableSubmit",
        "input input[type='file']": "enableSubmit",
    },

    enableSubmit: function(event) {
        let figureFileUrl = $(".figureFileUrl", this.el).val();
        let localFile = $("input[type='file']", this.el).val();
        console.log("enableSubmit", figureFileUrl, localFile);

        if (figureFileUrl || localFile) {
            $("button[type='submit'", this.el).prop("disabled", false);
        } else {
            $("button[type='submit'", this.el).prop("disabled", true);
        }
    },

    handleOpenFile: function(event) {
        event.preventDefault();

        let figureFileUrl = $(".figureFileUrl", this.el).val();
        let localFile = $("input[type='file']", this.el).val();

        console.log("figureFileUrl", figureFileUrl);
        console.log("localFile", localFile);
        console.log("this.app", this.app);
        
        if (localFile) {
            // upload JSON file and open figure
            const [file] = document.querySelector("#openLocalFileModal input[type=file]").files;
            const reader = new FileReader();

            reader.addEventListener("load", () => {
                console.log("reader.result", reader.result);
                let parsed;
                try {
                    parsed = JSON.parse(reader.result);
                } catch (e) {
                    alert("Invalid JSON file");
                }
                const app = this.app;
                const figureModel = this.model;
                if (parsed) {
                    var cb = function () {
                        app.navigate("/omero-figure/", {trigger: false});
                        figureModel.load_from_JSON(parsed);
                        figureModel.set('unsaved', false);
                    };
                    figureModel.checkSaveAndClear(cb);
                }
            });

            if (file) {
                reader.readAsText(file);
            }
        } else if (figureFileUrl) {
            console.log("/omero-figure/?file=" + figureFileUrl);
            // go to ?file=figureFileUrl
            this.app.navigate("/omero-figure/?file=" + figureFileUrl, {trigger: true});
        }
        hideModal("openLocalFileModal");
        return false;
    },

    render: function() {
        
    }
});
