
describe("Panel", function() {

    var panel;

    beforeEach(function() {
        panel = new Panel();
    })

    it("should have default dx, dy and rotation of zero", function() {
        expect(panel.get('dx')).toBe(0);
        expect(panel.get('dy')).toBe(0);
        expect(panel.get('rotation')).toBe(0);
    });


    it("should have default zoom of 100%", function() {
        expect(panel.get('zoom')).toBe(100);
    });


    describe("scalebar", function() {

        var sb;

        beforeEach(function() {
            sb = {
                "show": true,
                "length": 5,
                "position": "bottomleft",
                "color":"FFFFFF"
            }
            panel.save_scalebar(sb);
        })

        it("should be cloned", function() {
            expect(panel.get('scalebar')).toEqual(sb);
            expect(panel.get('scalebar')).not.toBe(sb);
        });

        it("should be updated by one attribute", function() {
            panel.save_scalebar({'color': 'FF0000'});
            var newSb = {
                "show": true,
                "length": 5,
                "position": "bottomleft",
                "color":"FF0000"
            }
            expect(panel.get('scalebar')).toEqual(newSb);
        });

        it("should be unchanged on hide", function() {
            panel.hide_scalebar();
            var hiddenScalebar = {
                "show": false,
                "length": 5,
                "position": "bottomleft",
                "color":"FFFFFF"
            }
            expect(panel.get('scalebar')).toEqual(hiddenScalebar);
        });
    });

    describe("labels", function() {

        var labels;

        beforeEach(function() {
            labels = [{
                'text':"labelText",
                'size':10,
                'color':'FF0000',
                'position':"top"
            }]
            panel.add_labels(labels);
        })

        it("should be cloned", function() {
            expect(panel.get('labels')).toEqual(labels);
            expect(panel.get('labels')).not.toBe(labels);
        });

        it("new label should be appended", function() {
            var newLab = {
                'text':"2nd Label",
                'size':20,
                'color':'FF0000',
                'position':"bottom"
            }
            var newLabels = [{
                'text':"labelText",
                'size':10,
                'color':'FF0000',
                'position':"top"
            }, {
                'text':"2nd Label",
                'size':20,
                'color':'FF0000',
                'position':"bottom"
            }]
            panel.add_labels([newLab]);
            expect(panel.get('labels')).toEqual(newLabels);
        });

        it("white external labels should be black", function() {
            var externalLab = {
                'text':"Top Label",
                'size':20,
                'color':'FFFFFF',
                'position':"top"
            }
            var cornerLab = {
                'text':"TopLeft Label",
                'size':20,
                'color':'FFFFFF',
                'position':"topleft"
            }
            panel.add_labels([externalLab, cornerLab]);
            expect(panel.get('labels')[1].color).toEqual("000000");
            expect(panel.get('labels')[2].color).toEqual("FFFFFF");
        });

        it("creates labels from channels", function() {
            var channels = [{
                'active': false,
                'label': 'DAPI',
                'color': '0000FF'
            },{
                'active': true,
                'label': 'GFP',
                'color': '00FF00'
            }]
            var newLabel = {
                'text': 'GFP',
                'size': 16,
                'position': 'top',
                'color': '00FF00'
            }
            panel.set('channels', channels);
            panel.create_labels_from_channels({position: 'top', size: 16});
            expect(panel.get('labels').length).toEqual(2);
            expect(panel.get('labels')[1]).toEqual(newLabel);
        });

        it("uses time for labels", function() {
            expect(panel.get_time_label_text('secs')).toEqual('0 secs');
            expect(panel.get_time_label_text('mins')).toEqual('0 mins');
            expect(panel.get_time_label_text('hrs:mins')).toEqual('0:00');

            panel.set('deltaT', [0, 30, 60, 90])
            panel.set('theT', 3)
            expect(panel.get_time_label_text('secs')).toEqual('90 secs');
            expect(panel.get_time_label_text('mins')).toEqual('2 mins');
            expect(panel.get_time_label_text('hrs:mins')).toEqual('0:02');
            expect(panel.get_time_label_text('hrs:mins:secs')).toEqual('0:01:30');
        })
    });
})
