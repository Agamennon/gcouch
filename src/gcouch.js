
module.exports = exports = gcouch = function(couchUrl,port,user,pass){

    var relax = require('./relax')(couchUrl,port,user,pass);
    return require('./serverApi.js')(relax);
};
