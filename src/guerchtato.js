var $q = require('q');
module.exports = function(gcouch){

        var self = this;

        function saveAndLog(utilObj){
            var  report = {};
            report.rows = utilObj.resultsToLog;
            report.logReport = {total:report.rows.length,detalhes:'sem detalhes'};
            return (utilObj.resultsToSave.length  < 1) ? report  :
                gcouch.bsave(utilObj.resultsToSave).then(
                    function(result){
                        report.saveReport = result;
                        return report;
                    },
                    function(erro){
                        report.saveReport = erro;
                        $q.reject(report);
                    }
                );
        }

        function nomalizaDados(data){

            var docOrValue = 'value';
            if (data)
                if (data.rows){
                    if (data.rows.length > 0)
                        if (data.rows[0].doc) {
                            docOrValue = 'doc';   //podevir .value ou .doc dependendo de quem reponde a query
                        }
                    for (var x=0 ; x < data.rows.length;x++){
                        data.rows[x] = data.rows[x][docOrValue]
                    }
                }else
                    throw "erro, data nao parece ser uma resposta correta de uma query"
        }

        function Util(){
            var self = this;
            this.resultsToSave = [];
            this.resultsToLog = [];
            this.save = function(doc){
                self.resultsToSave.push(doc);
            }
            this.log = function(doc){
                self.resultsToLog.push(doc);
            }
        }

        function executaTarefas (data){
            var  d = $q.defer(),
                func;
            nomalizaDados(data);  //arrays sao por referencia
            var utilObj = new Util;

            try {
                if (typeof self.opcoes.tarefa === "string")
                    func = eval("("+self.opcoes.tarefa+")"); //pega a funcao do cliente que eh um string e transforma em uma funcao js
                if (typeof self.opcoes.tarefa === "function")
                    func = self.opcoes.tarefa;
                for (var x=0 ; x < data.rows.length;x++){
                    func(utilObj,data.rows[x]);
                }
            }catch (err){
                d.reject("executaTarefas - "+err.toString());
            }
            var doc = {};
            doc.rows = utilObj.resultsToLog;
            d.resolve(utilObj);
            return d.promise;
        }

     //todo implementar paginacao
     return function exec(opcoes,cb){
            self.opcoes = opcoes;
            if (opcoes.listName){//viewName,listName,params,data,designDoc,cb){
                return gcouch.list(opcoes).then(executaTarefas).then(saveAndLog).nodeify(cb);
            }else{
                if (opcoes.viewName){
                    return gcouch.view(opcoes).then(executaTarefas).then(saveAndLog).nodeify(cb);
                } else {
                    return gcouch.get('_all_docs?include_docs=true').then(executaTarefas).then(saveAndLog).nodeify(cb);
                }
            }
        }

};
