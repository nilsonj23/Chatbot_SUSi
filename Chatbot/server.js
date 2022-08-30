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
    agent.add(`🙋‍♀️ Olá! Eu me chamo SUSi-Carioca. Sou uma assistente do SUS que posso lhe dar informações sobre locais de atendimento, suas consultas marcadas, exames marcados ou já feitos e remédios que foram receitados para você nas consultas.
Podemos conversar aqui no whatsapp! Eu funciono as 24 horas do dia, todos os dias da semana!`);
    
    agent.add("Seja muito bem vindo(a)! Pra começar escolha um item abaixo:" +
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
          agent.add("Não encontrei nenhum CPF ou CNS (número do SUS) que você digitou.");
        }
        agent.add(resposta);
        })
        .catch(err => console.log(err));
    }
    else {
      agent.add("O número que você digitou está errado! Infelizmente terei que voltar seu atendimento para o menu inicial.");
      agent.add("Seja muito bem vindo(a)! Pra começar escolha um item abaixo:" +
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
          agent.add("Não encontrei nenhum CPF ou CNS (número do SUS) que você digitou.");
        }
        agent.add(resposta);
        })
        .catch(err => console.log(err));
    }
    else {
      agent.add("O número que você digitou está errado! Infelizmente terei que voltar seu atendimento para o menu inicial.");
      agent.add("Seja muito bem vindo(a)! Pra começar escolha um item abaixo:" +
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
      agent.add("O número que você digitou está errado! Infelizmente terei que voltar seu atendimento para o menu inicial.");
      agent.add("Seja muito bem vindo(a)! Pra começar escolha um item abaixo:" +
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
  }


  //4° FUNÇÃO DE INFORMAR AS FARMACIAS POPULARES
  function farmacias(agent) {
    const cep = agent.parameters.cep.toString();
    let flagAchei = false;
    let resposta = '';

    // Entra se for String
    if (isNaN(parseInt(cep))){
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Farmacias")
        .then((res) => {
          res.data.map(coluna => {
            if (cep.toUpperCase() == coluna.Bairro) {
              if (cep.toUpperCase() == coluna.Bairro && flagAchei == false) {
                resposta += "⚕️ *Pelo Bairro que você digitou eu achei esses endereços próximos:* ⚕️\n\n";
                flagAchei = true;
              }
              resposta += `*Farmácia:* ${coluna.Razão_Social}
*Endereço:* ${coluna.Endereço}
*Bairro:* ${coluna.Bairro}
=============================\n\n`;
            }
          });
        if (flagAchei == false) {
          agent.add("O _Bairro_ que você digitou não foi encontrado! Infelizmente terei que voltar seu atendimento para o menu inicial.");
          agent.add("Seja muito bem vindo(a)! Pra começar escolha um item abaixo:" +
                    "\n\n" +
                    "*[1]* - Você quer ver suas _consultas_?" +
                    "\n\n" +
                    "*[2]* - Você quer ver seus _Exames_?" +
                    "\n\n" +
                    "*[3]* - Ver os _remédios_ receitados para você." +
                    "\n\n" +
                    "*[4]* - Buscar pelos endereços das _Farmácias Populares_ do Rio de Janeiro.");
          agent.add(`A qualquer momento digite *"menu"* ou *"voltar"* para retornar a lista de opções! OK.`);    
        }
        agent.add(resposta);
      })
        .catch(err => console.log(err));
    }
    
    // Entra se for numero
    if (cep.toString().length == 8) {
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Farmacias")
        .then((res) => {
          res.data.map(coluna => {
            if (coluna.CEP >= (parseInt(cep)-150) && coluna.CEP <= (parseInt(cep)+150)) {
              if ((coluna.CEP >= (parseInt(cep)-150) && coluna.CEP <= (parseInt(cep)+150)) && flagAchei == false) {
                resposta += "⚕️ *Pelo CEP que você digitou eu achei esses endereços próximos:* ⚕️\n\n";
                flagAchei = true;
              }
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
      agent.add("O número que voce digitou não é um CEP válido! Infelizmente terei que voltar seu atendimento para o menu inicial.");
      agent.add("Seja muito bem vindo(a)! Pra começar escolha um item abaixo:" +
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



/*
let nomesUnidades = [];
let numero = 0;
var media_unidade = 0;
var media_temp = 0;
var media_info = 0;
var media_limp = 0;

//FUNÇÃO PARA INSERIR ID ÚNICO
function uniqueID() {
  function chr4() {
    return Math.random().toString(16).slice(-6);
  }
  return chr4();
  

  //2° FUNÇÃO DE PROCURAR UNIDADES DE ATENDIMENTO
  function procurarUnidades(agent) {
    agent.add(
      "Você pode consultar pelo seu endereço ou pelo seu CEP por aqui: 👇" +
        "\n" +
        "\n" +
        "👉 https://prefeitura.rio/ondeseratendido");
    //https://pcrj.maps.arcgis.com/apps/webappviewer/index.html?id=014d8ab512a34f259bb27c8a13d4d65f
  }


  //3° FUNÇÃO DE PESQUISAR CUNSULTAS E EXAMES
  function pesquisarConsultas(agent) {
    const { cpf, tipo } = agent.parameters;
    let tipo1 = tipo.toUpperCase();
    let flag = false;
    let flagAchei = false;
    let erroTipo = false;
    let cabecalho = false;
    
    if (tipo1 != 'CONSULTA' && tipo1 != 'SOLICITO CONSULTA' && tipo1 != 'QUERO CONSULTA' && 
        tipo1 != 'EXAME' && tipo1 != 'SOLICITO EXAME' && tipo1 != 'QUERO EXAME' && 
        tipo1 != 'SOLICITO O EXAME' && tipo1 != 'QUERO O EXAME' && tipo1 != 'QUERO O ESAME'
        && tipo1 != 'EXAMEE' ){
      agent.add("Você informou o tipo inválido.");
      erroTipo = true;
      }
    
    if ((cpf.toString().length == 11 || cpf.toString().length == 15) && erroTipo == false) {
      let resposta = '';
      return axios
        .get("https://sheetdb.io/api/v1/lw121s3stglpe")
        .then((res) => {
          res.data.map(coluna => {
            if (cpf == coluna.CPF || cpf == coluna.SUS) {
              if ((cpf == coluna.CPF || cpf == coluna.SUS) && flagAchei == false) {
                flagAchei = true;
              }
              if ((tipo1 == 'CONSULTA' || tipo1 == 'SOLICITO CONSULTA' || tipo1 == 'QUERO CONSULTA') 
                  && coluna.Consulta != '-'){
                if (!cabecalho){
                  resposta += `🩺 *Para você, eu achei esse(s) Consulta(s):* 🩺\n\n`;
                  cabecalho = true;
                }
                flag = true;
                resposta += `*Seu nome:* ${coluna.Nome}
*Tipo da Consulta:* ${coluna.Consulta}
*Local de Atendimento:* ${coluna.Posto_Atendimento}
*Endereço:* ${coluna.Endereco}
*Data:* ${coluna.Data}
*Horário:* ${coluna.Hora} horas
=========================\n\n`;
              }
              else if ((tipo1 == 'EXAME' || tipo1 == 'SOLICITO EXAME' || tipo1 == 'QUERO EXAME' || 
                        tipo1 == 'SOLICITO O EXAME' || tipo1 == 'QUERO O EXAME' || 
                        tipo1 == 'QUERO O ESAME' || tipo1 == 'EXAMEE') && coluna.Exame != '-'){
                if (!cabecalho){
                  resposta += `🩺 *Para você, eu achei esse(s) Exame(s):* 🩺\n\n`;
                  cabecalho = true;
                }
                flag = true;
                resposta += `*Seu nome:* ${coluna.Nome}
*Nome do Exame:* ${coluna.Exame}
*Local de Atendimento:* ${coluna.Posto_Atendimento}
*Endereço:* ${coluna.Endereco}
*Data:* ${coluna.Data}
*Horário:* ${coluna.Hora} horas
=========================\n\n`;
              }
            }  
          });
        if (flag == false || flagAchei == false) {
          resposta = `Não encontrei consultas ou exames agendados para você.`;
        }
        agent.add(resposta);
        agent.add(`*DICA:* Procure chegar alguns minutos antes, para evitar problemas!`);
      })
        .catch(err => console.log(err));
    } 
    else if (erroTipo == false){
      agent.add("O número que você digitou está errado!");
    }
  }
  
  
  //5° FUNÇÃO DE PROCURAR AS UNIDADES DE ATENDIMENTO
  function avaliaçãoUnidades(agent) {
    const { unidade } = agent.parameters;
    let unidades = [];
    unidades = unidade.toLowerCase().split(' ');
    let nomeUnidade = [];
    
    for (let i = 0; i < unidades.length; i++) {
      if (unidades[i] != 'clinica' && unidades[i] != 'clínica' && unidades[i] != 'da' && unidades[i] != 'cms'
          && unidades[i] != 'hospital' && unidades[i] != 'posto' && unidades[i] != 'saude' && unidades[i] != 'saúde'
          && unidades[i] != 'de' && unidades[i] != 'familia' && unidades[i] != 'do' && unidades[i] != 'da'
          && unidades[i] != 'sms' && unidades[i] != 'família'){
        nomeUnidade.push(unidades[i]);
      }
    }
    
    let resposta = '';
    let cont = 1;
    let unico = false;
    return axios
      .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Avaliacao")
      .then((res) => {
          res.data.map(coluna => {
            let flag = false;
            for (let i = 0; i < nomeUnidade.length; i++) {
              if (coluna.Posto_Atendimento.toLowerCase().match(nomeUnidade[i]) && flag == false) {
                if (unico == false){
                  resposta += `Vou te mostrar opções parecidas. Agora você escolhe um número:\n\n`;
                  unico = true;
                }
                nomesUnidades.push(coluna.ID);
                resposta += `*[${cont}] -* ${coluna.Posto_Atendimento}\n`;
                cont ++;
                flag = true;
              }
            }
          });
      
      if (resposta == '') {
        agent.add('Que pena, não achei nehum local de atendimento com este nome. 😔');
      }
      else {
        agent.add(`Umm... Acho que você digitou errado ou eu não entendi bem 🤷‍♂️`);
        agent.add(resposta);
      }
      })
        .catch(err => console.log(err));
  }


  //6° FUNÇÃO DE INTERMEDIARIA DE TRATAMENTO DA AVALIAÇÃO DE UMA UNIDADE DE ATENDIMENTO
  function tratamento(agent) {
    const { opcao } = agent.parameters;
    numero = opcao;
    
    return axios
      .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Avaliacao")
      .then((res) => {
        res.data.map(coluna => {
            if (nomesUnidades[numero-1] == coluna.ID) {
              media_unidade = coluna.N_Unidade;
              media_temp    = coluna.N_Temp;
              media_info    = coluna.N_Info;
              media_limp    = coluna.N_Limp;
            }
        });
    agent.add("Aqui, você vai escolher uma das duas opções:" +
      "\n\n" +
      "*[A]* - Ver a média das notas do local de atendimento." +
      "\n" +
      "*[B]* - Dar sua nota para esse local de atendimento.");
      })
      .catch(err => console.log(err));
  }

  //7° FUNÇÃO DE VISUALIZAR A AVALIAÇÃO DE UMA UNIDADE DE ATENDIMENTO
  function opA(agent) {
    let resposta = '';
    return axios
      .get("https://sheetdb.io/api/v1/lw121s3stglpe?sheet=Avaliacao")
      .then((res) => {
        res.data.map(coluna => {
            if (nomesUnidades[numero-1] == coluna.ID) {
              resposta += `🏥 O local de atendimento que você pesquisou foi: 🏥\n\n
*Nome do local:* ${coluna.Posto_Atendimento}\n 
*Endereço:* ${coluna.Endereco}\n
*LOCAL DE ATENDIMENTO:* ${coluna.N_Unidade}\n
*TEMPO QUE VOCÊ ESPEROU PARA SER ATENTIDO:* ${coluna.N_Temp}\n
*VOCÊ ENTENDEU AS INFORMAÇÕES DADAS PELO MÉDICO:* ${coluna.N_Info}\n
*ARRUMAÇÃO E LIMPEZA DO LOCAL DE ATENDIMENTO:* ${coluna.N_Limp}`;
            }
        });
        agent.add(resposta);
      })
      .catch(err => console.log(err));
  }

  //8° FUNÇÃO DE AVALIAE DE UMA UNIDADE DE ATENDIMENTO
  function opB(agent) {
    const { nota_unidade, nota_temp, nota_info, nota_limp } = agent.parameters;
    let resposta = '';
    let numero_invaliido = false;
        
    if ((parseInt(nota_unidade) <= 5 && parseInt(nota_unidade) >= 1) && (parseInt(nota_temp) <= 5 && parseInt(nota_temp) >= 1) 
        && (parseInt(nota_info) <= 5 && parseInt(nota_info) >= 1) && (nota_limp <= 5 && nota_limp >= 1)) {
      
      numero_invaliido = true;

      media_unidade = (parseFloat(media_unidade) + parseInt(nota_unidade)) / 2;
      media_unidade = media_unidade.toFixed(1);
    
      media_temp = (parseFloat(media_temp) + parseInt(nota_temp)) / 2;
      media_temp = media_temp.toFixed(1);
    
      media_info = (parseFloat(media_info) + parseInt(nota_info)) / 2;
      media_info = media_info.toFixed(1);
    
      media_limp = (parseFloat(media_limp) + parseInt(nota_limp)) / 2;
      media_limp = media_limp.toFixed(1);
    
      let aux = nomesUnidades[numero-1].toString();
    
      return axios
        .patch(`https://sheetdb.io/api/v1/lw121s3stglpe/ID/${aux}?sheet=Avaliacao`,{
          "data": {"N_Unidade": media_unidade,
                   "N_Temp": media_temp,
                   "N_Info": media_info,
                   "N_Limp": media_limp,
                  }
      }).then( res => {
          agent.add(`Muito obrigado pela sua avalição. 
Juntos podemos melhorar nosso sistema de saúde. 😁`);
      })
      .catch(err => console.log(err));      
      } 
    
    if (numero_invaliido == false) {
      agent.add(`Ops! acho que você digitou um numero invalido. `);
    }
  }

  //9° FUNÇÃO DE INFORMAÇÕES SOBRE O COVD-19
  function covid(agent) {
    agent.add("Informações que sobre a pandemia do Coronavirus, clique abaixo para ver as informações do Governo Federal:" +
        "\n" +
        "👉 https://www.gov.br/saude/pt-br/coronavirus");
    
    agent.add("Para ver mais dados numérico sobre a da pandemia, clique abaixo:" +
        "\n" +
        "👉 https://covid.saude.gov.br/");
  }
  
  
    function cadastro(agent) {
    const { nome, telefone, validar } = agent.parameters;
    const data = [
      {
        Nome: nome,
        Telefone: telefone,
        Validar: validar,
        //ID: uniqueID(),
      },
    ];
    axios.post(
      "https://sheet.best/api/sheets/d09b1af1-0ddc-459c-96e4-cccf3d962470",
      data
    );
    agent.add(`Muito bem ${nome}, o seu cadastro foi realizado com sucesso.`);
    agent.add("Fique tranquilo(a) os seus dados estão seguros.");
  }
  
*/
  
