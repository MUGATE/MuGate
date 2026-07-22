import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    mapOfferingsHeaders,
    offeringsHeaderMapIsUsable,
} from "./offerings-parse.util";

describe("offerings-parse.util", () => {
    it("maps a typical UMS offerings header row", () => {
        const idx = mapOfferingsHeaders([
            "#",
            "Code",
            "Name",
            "Section",
            "Type",
            "Credits",
            "Instructor",
            "CRN",
            "Schedule",
            "Capacity",
            "Enrolled",
            "Room",
        ]);
        assert.equal(idx.courseCode, 1);
        assert.equal(idx.courseName, 2);
        assert.equal(idx.section, 3);
        assert.equal(idx.type, 4);
        assert.equal(idx.credits, 5);
        assert.equal(idx.instructor, 6);
        assert.equal(idx.schedule, 8);
        assert.equal(idx.capacity, 9);
        assert.equal(idx.enrolled, 10);
        assert.equal(idx.room, 11);
        assert.equal(offeringsHeaderMapIsUsable(idx), true);
    });

    it("fails usable check when Code/Name missing", () => {
        const idx = mapOfferingsHeaders(["Foo", "Bar", "Baz"]);
        assert.equal(offeringsHeaderMapIsUsable(idx), false);
    });
});
