
describe("Panel", function() {
    it("should have default zoom of 100%", function(){

        var p = new Panel();
        expect(p.get('zoom')).toBe(100);
    });
})
