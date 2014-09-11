
var gcouch = require('../src/gcouch.js')('localhost','5984','admin','123');


describe("gcouch [Server API] Testes", function () {

    function semErro(self,erro){
        if (erro){
            self.fail(Error(JSON.stringify(erro)));
            return false;
        }else
            return true;
    }

    it('deve criar db para o teste', function (done) {
        gcouch.create('gcouchtest',function(erro,data){
            done();
        });

    });



    var db = gcouch.use('gcouchtest'),
        doc1 = {
            _id:'teste01',
            nome:'gui',
            numero:'91017001'
        },

        doc2 = {
            _id:'teste02',
            nome:'mauro',
            tipo:'teste',
            numero:'1341017001'
        },

        doc3 = {
            nome:'teste03',
            tipo:'teste',
            numero:'30252957'
        };


    it('deve salvar docs para o teste', function (done) {
        db.bsave([doc1,doc2,doc3],{},function(erro,data){
            done();
        });
    });



    it('deve usar exec (guerchtato) para buscar documentos', function (done) {

        var opc = {};

        opc.tarefa = function(util,doc){
            if (doc.tipo === "teste"){
                util.log(doc);
            }
        };
        db.exec(opc,function(erro,data){
            if (semErro(this,erro)){
                expect(data.logReport.total).toBe(2);
            }
            done();
        }.bind(this));
    });


    it('deve remover db do teste', function (done) {
        gcouch.delete('gcouchtest',function(erro,data){
            done();
        });
    });


});