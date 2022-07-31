const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");
const axios = require("axios");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

let codigoUser = '';
let nome = '';


//FUNÇÃO PARA PEGAR HORÁRIO
let presente = Date.now();
let mesNome = new Array ("Janeiro", "Fevereiro", "Março", "Abril", "Maio", 
                         "Junho", "Julho", "Agosto", "Outubro", "Novembro", "Dezembro");


app.use(express.static("public"));
app.get("/", (request, response) => {
  response.send("Teste do chatbot no Glitch.");
});

app.post("/webhook", function (request, response) {
  const agent = new WebhookClient({ request: request, response: response });

  //0° FUNÇÃO DE MENU INICIAL
  function menuInicial(agent) {
    agent.add(`🙋‍♀️ Olá! Eu me chamo SUSi.Sou uma assistente do SUS que posso lhe dar informações sobre locais de atendimento, suas consultas marcadas, exames marcados ou já feitos e remédios que foram receitados para você nas consultas.
Podemos conversar aqui no whatsapp! Eu funciono as 24 horas do dia, todos os dias da semana!`);
    
    agent.add("Seja muito bem vindo(a)! Pra começar escolha uma item abaixo:" +
        "\n\n" +
        "*[1]* - Você quer ver suas _consultas_?" +
        "\n\n" +
        "*[2]* - Você quer ver seus _Exames_?" +
        "\n\n" +
        "*[3]* - Ver os _remédios_ receitados para você." +
        "\n\n" +
        "*[4]* - Buscar pelos endereços das _Farmácias Populares_ do Rio de Janeiro."
    );
    agent.add(`A qualquer momento digite *"menu"* ou *"voltar"* para retornar a lista de opções! OK.`);
  }  
  
  
  //1.1° FUNÇÃO PARA PEGAR O CODIGO DO USUARIO
  function procurarConsultas(agent) {
    codigoUser = agent.parameters.codigoUser.toString();
    let resposta = '';
    let achei = false;
    
    if ((codigoUser.length == 11 || codigoUser.length == 15) ){
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {
            if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && coluna.Consulta != '-' && achei == false ) {
              achei = true;
              nome = coluna.Nome;
              resposta += "Aqui, você vai escolher uma das duas opções:" +
                        "\n" +
                        "\n" +
                        "*[A]* - Ver consultas já feitas.\n" + 
                        "*[B]* - Ver consultas marcadas. ";
            }
          });
        if (achei == false) {
          agent.add("Não encontrei nehum CPF ou CNS (número do SUS) que você digitou.");
        }
        agent.add(resposta);
        })
        .catch(err => console.log(err));
    }
    else {
      agent.add("O número que você digitou está errado!");
    }
  }

  
  //1.2° FUNÇÃO RETORNAR O HISTORICO DE CONSULTAS DO USUARIO
  function ConsultasA(agent) {
    let resposta = "🩺 Para você, eu achei esse(s) Consulta(s) já *feitas*: 🩺\n" +
                   "*Seu nome:* "+ nome + "\n\n"; 
    return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {   
            if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && coluna.Consulta != '-') {
              let dataBD = (coluna.Data).toString();
              let dataBDmili = Date.parse(dataBD); 
              
              if (dataBDmili < presente){
                let partes = dataBD.split('-');
                let mes = mesNome [parseInt(partes[1]-1)];
                let dateFormat = partes[2] + " de " + mes + " de " + partes[0];
              
                resposta += `*Tipo da Consulta:* ${coluna.Consulta}
*Local de Atendimento:* ${coluna.Posto_Atendimento}
*Endereço:* ${coluna.Endereco}
*Data:* ${dateFormat}
*Horário:* ${coluna.Hora} horas
===============================\n\n`;          
              }
            }
          });
        agent.add(resposta);
        })
        .catch(err => console.log(err));
  }
  
    
  //1.3° FUNÇÃO RETORNAR AS CONSULTAS A SEREM FEITAS PELO USUARIO
  function ConsultasB(agent) {
    let resposta = "🩺 Para você, eu achei essa(s) Consulta(s) *marcadas*: 🩺\n" +
                   "*Seu nome:* "+ nome + "\n\n";    
    return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {   
            if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && coluna.Consulta != '-') {
              let dataBD = (coluna.Data).toString();
              let dataBDmili = Date.parse(dataBD); 
              
              if (dataBDmili > presente){
                let partes = dataBD.split('-');
                let mes = mesNome [parseInt(partes[1]-1)];
                let dateFormat = partes[2] + " de " + mes + " de " + partes[0];
              
                resposta += `*Tipo da Consulta:* ${coluna.Consulta}
*Local de Atendimento:* ${coluna.Posto_Atendimento}
*Endereço:* ${coluna.Endereco}
*Data:* ${dateFormat}
*Horário:* ${coluna.Hora} horas
===============================\n\n`;          
              }
            }
          });
        agent.add(resposta);
        })
        .catch(err => console.log(err));
  }

  
  //2.1° FUNÇÃO PARA PEGAR O CODIGO DO USUARIO
  function procurarExames(agent) {
    codigoUser = agent.parameters.codigoUser.toString();
    let resposta = '';
    let achei = false;
    
    if ((codigoUser.length == 11 || codigoUser.length == 15) ){
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {
            if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && coluna.Exame != '-' && achei == false ) {
              achei = true;
              nome = coluna.Nome;
              resposta += "Aqui, você vai escolher uma das duas opções:" +
                        "\n" +
                        "\n" +
                        "*[A]* - Ver exames já feitas.\n" + 
                        "*[B]* - Ver exames marcados. ";
            }
          });
        if (achei == false) {
          agent.add("Não encontrei nehum CPF ou CNS (número do SUS) que você digitou.");
        }
        agent.add(resposta);
        })
        .catch(err => console.log(err));
    }
    else {
      agent.add("O número que você digitou está errado!");
    }
  }
  
  
  //2.2° FUNÇÃO RETORNAR O HISTORICO DE EXAMES DO USUARIO
  function ExamesA(agent) {
    let resposta = "🩺 Para você, eu achei esse(s) Exame(s) já *feitos*: 🩺\n" +
                   "*Seu nome:* "+ nome + "\n\n"; 
    return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {   
            if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && coluna.Exame != '-') {
              let dataBD = (coluna.Data).toString();
              let dataBDmili = Date.parse(dataBD); 
              
              if (dataBDmili < presente){
                let partes = dataBD.split('-');
                let mes = mesNome [parseInt(partes[1]-1)];
                let dateFormat = partes[2] + " de " + mes + " de " + partes[0];
              
                resposta += `*Tipo de Exame:* ${coluna.Exame}
*Local de Atendimento:* ${coluna.Posto_Atendimento}
*Endereço:* ${coluna.Endereco}
*Data:* ${dateFormat}
*Horário:* ${coluna.Hora} horas
===============================\n\n`;          
              }
            }
          });
        agent.add(resposta);
        })
        .catch(err => console.log(err));
  }
  
  
  //2.3° FUNÇÃO RETORNAR OS EXAMES A SEREM FEITOS PELO USUARIO
  function ExamesB(agent) {
    let resposta = "🩺 Para você, eu achei esse(s) Exame(s) *marcados*: 🩺\n" +
                   "*Seu nome:* "+ nome + "\n\n";    
    return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {   
            if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && coluna.Exame != '-') {
              let dataBD = (coluna.Data).toString();
              let dataBDmili = Date.parse(dataBD); 
              
              if (dataBDmili > presente){
                let partes = dataBD.split('-');
                let mes = mesNome [parseInt(partes[1]-1)];
                let dateFormat = partes[2] + " de " + mes + " de " + partes[0];
              
                resposta += `*Tipo de Exame:* ${coluna.Exame}
*Local de Atendimento:* ${coluna.Posto_Atendimento}
*Endereço:* ${coluna.Endereco}
*Data:* ${dateFormat}
*Horário:* ${coluna.Hora} horas
===============================\n\n`;          
              }
            }
          });
        agent.add(resposta);
        })
        .catch(err => console.log(err));
  }
  
  
  //3° FUNÇÃO DE INFORMAR OS MEDICAMENTOS UTILIZADOS
  function medicamentos(agent) {
    codigoUser = agent.parameters.codigoUser.toString();
    let flagAchei = false;
    
    if (codigoUser.toString().length == 11 || codigoUser.toString().length == 15) {
      let resposta = ''
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Medicamentos")
        .then((res) => {
          res.data.map(coluna => {
            if (codigoUser == coluna.CPF || codigoUser == coluna.SUS) {
              if ((codigoUser == coluna.CPF || codigoUser == coluna.SUS) && flagAchei == false) {
                resposta += "💊 *O que foi receitado para você:* 💊\n" +
                            "*Seu nome:* " + coluna.Nome + " \n\n";
                flagAchei = true;
              }
              resposta += `*Nome do Médico:* ${coluna.Medico}
*Remédio:* ${coluna.Medicamento}
*Frequência:* ${coluna.Periodicidade}
*Para que serve:* ${coluna.Indicacao}
=========================\n\n`;
            }
          });
        if (flagAchei == false) {
              agent.add("Não encontrei nenhum remédio receitado para você.");      
        }
        agent.add(resposta);
      })
        .catch(err => console.log(err));
    } 
    else {
      agent.add("O número que voce digitou está errado!");
    }
  }


  //4° FUNÇÃO DE INFORMAR AS FARMACIAS POPULARES
  function farmacias(agent) {
    const cep = agent.parameters.cep.toString();
    let flagAchei = false;
  
    if (cep.toString().length == 8) {
      let resposta = ''
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Farmacias")
        .then((res) => {
          res.data.map(coluna => {
            if (coluna.CEP >= (parseInt(cep)-100) && coluna.CEP <= (parseInt(cep)+100)) {
              if ((coluna.CEP >= (parseInt(cep)-100) && coluna.CEP <= (parseInt(cep)+100)) && flagAchei == false) {
                resposta += "⚕️ *Pelo CEP que você digitou eu achei esses endereços próximos:* ⚕️\n\n";
                flagAchei = true;
              }
              console.log("--2");
              resposta += `*Farmácia:* ${coluna.Razão_Social}
*Endereço:* ${coluna.Endereço}
*Bairro:* ${coluna.Bairro}
=============================\n\n`;
            }
          });
        if (flagAchei == false) {
              agent.add("Não encontrei nenhuma farmácia perto de você.");      
        }
        agent.add(resposta);
      })
        .catch(err => console.log(err));
    } 
    else {
      agent.add("O número que voce digitou não é um CEP válido!");
    }
  }
  
  
  //ULTIMA FUNÇÃO DE DESPEDIDA
  function despedida(agent) {
    agent.add("Foi bom conversar com você, até breve. 😘");
  }


  //MAPEAMENTO DAS INTENTS DO DIALOGFLOW
  let intentMap = new Map();
  intentMap.set("005_menuInicial", menuInicial);
  
  intentMap.set("010_op1_procurarConsultas", procurarConsultas);
  intentMap.set("013_op1_consultasA", ConsultasA);
  intentMap.set("016_op1_consultasB", ConsultasB);
  
  intentMap.set("020_op2_procurarExames", procurarExames);
  intentMap.set("023_op2_examesA", ExamesA);
  intentMap.set("026_op2_examesB", ExamesB);

  intentMap.set("030_op3_Medicamentos", medicamentos);
  
  intentMap.set("040_op4_Farmacias", farmacias);
  
  intentMap.set("100_despedida", despedida);
  agent.handleRequest(intentMap);
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
