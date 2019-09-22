//https://dev.to/ykyuen/web-ui-testing-in-nodejs--kda
import {
    exportAllDeclaration
} from "babel-types";

describe('Google Search', function () {
    before(function () {
        casper.start('https://www.google.com.hk/');
    });

    it('should have returned http 200', function () {
        exportAllDeclaration(casper.currentHTTPStatus).to.equal(200);
    });

})