
var AnnotationsModel = Backbone.Model.extend({
    parse: function(annotation) {
        var type = annotation['@type'];
        annotation.type = type.substring(type.lastIndexOf('#')+1);
        return annotation;
    }
});

var AnnotationsList = Backbone.Collection.extend({
    model: AnnotationsModel,

    parse: function (response) {
        if (typeof response === 'object' && response !== null &&
            Array.isArray(response.annotations)) {
                for (var a in response.annotations) {
                    this.push(
                        new AnnotationsModel(
                            response.annotations[a], {parse: true}));
                }
        }

        return this.models;
    }
});
