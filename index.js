import 'dotenv/config'
import Discord, { Guild } from 'discord.js'
import { getRandomNumber } from './random.js';
import { differenceInSeconds } from "date-fns";
import { MessageButton } from 'discord-buttons';
import fs from 'fs/promises';
import path from "path";
import jimp from 'jimp'

const { token, prefix, channelBanco } = process.env

const client = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USERS', 'GUILD_MEMBER'],
});

let users = [], //banco usuários temporário
    cartelaUsers = [], // banco cartelas temporário
    numOfCards = 1, // contador de cartelas que saíram
    numSorteados = [], //banco onde os números sortedos estão
    contadorSortear = 0, //sortear um novo número em outra posição no banco de números sorteados
    nBanco = 0, //contador para pular as posiçoes no "banco"
    positionWinner = 0; // número de vencedores

const list = [], //banco onde ficará todos os números pronto para serem colocados na cartela
    numbersCount = 75, //rage de quantos números serão sorteados
    usersTimeout = {}; //delay do comando para o usuário

function verifySecondsDiff(userData, messageData) {
    if (userData === undefined) {
        return false;
    }
    if (differenceInSeconds(messageData, userData) < 10) {

        return true;
    }
    return false;
}

client.on("ready", async() => {

    for (let q = 1; q <= numbersCount; q++) {
        const numberImage = (await jimp.read(`./numbers/numero-${q}.png`)).resize(60, 60)
        list.push(numberImage)
    }
    console.log("números renderizados, bot ON")
});

client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const channelId = client.channels.cache.get(channelBanco),
        args = message.content.slice(prefix.length).trim().split(/ +/g),
        comando = args.shift().toLowerCase();

    let idUser = message.author.id, //id do usuário que será armazenado para consulta
        tagUser = message.author.tag, //tag usuário
        avatarUser = message.author.displayAvatarURL({ format: "png" }),
        nameUser = message.author.username,
        channelMessage = message.channel.id;

    console.log(message.channel.id)
    if (message.channel.type === "dm" || channelMessage === '861438858229841921' || channelMessage === '864954942137827358') {

        if (idUser !== "454059471765766156") {
            const messageDate = new Date()
            if (verifySecondsDiff(usersTimeout[message.author.id], messageDate)) {
                const seconds = 10 - differenceInSeconds(messageDate, usersTimeout[message.author.id])

                message.reply(`espere ${seconds} segundos antes de mandar uma nova mensagem :yawning_face: `)
                return;
            } else {
                usersTimeout[message.author.id] = messageDate
            }
        }

        if (comando === "reiniciar") { //comando para instaciar os objetos como eram antes

            if (idUser === '454059471765766156' || '544226820925685770') {
                console.log(tagUser + " reiniciou o jogo")
                users.splice(0, users.length)
                cartelaUsers.splice(0, cartelaUsers.length)
                numOfCards = 1;
                numSorteados.splice(0, numSorteados.length)
                contadorSortear = 0;
                nBanco = 0;
                positionWinner = 0;

                message.channel.send("Todas as cartelas foram apagadas. Jogo reiniciado :card_box:  ")
            } else {
                message.channel.send("<@" + idUser + "> você não tem permissão para reiniciar o jogo! :face_with_monocle: :raised_back_of_hand: ")
            }

        }
        //instanciar todos os números para a list(jimp não deixa com o 'for')

        if (comando === "cartela") { //verificar comando
            let userRepeat = false;

            for (let m = 0; m < users.length; m++) {
                if (idUser === users[m]) {
                    userRepeat = true;

                }
            }

            //criação da tabela e matriz no layout
            if (userRepeat === false) {

                message.channel.send("Gerando cartela, aguarde  :arrows_counterclockwise:")
                console.log(tagUser + " pediu uma cartela")

                //instancia do layout que será usado de fundo
                let layout = await jimp.read('./layout/layout.png')

                let listNumbersSorteados = [];
                let randomNumber = getRandomNumber();

                let coordinateY = 125;


                for (let i = 1; i <= 5; i++) {

                    let coordinateX = 55;

                    for (let j = 1; j <= 5; j++) {

                        //pular centro do layout
                        let nulo = false;
                        if (i === 3 && j === 3) {
                            nulo = true;
                        } else {
                            nulo = false;
                        }

                        if (!nulo) {

                            while (listNumbersSorteados.find(e => e == randomNumber)) {

                                randomNumber = getRandomNumber();

                            }

                            listNumbersSorteados.push(randomNumber);
                            layout.composite(list[randomNumber - 1], coordinateX, coordinateY);

                        }
                        //pular coordenadas X
                        coordinateX += 85;

                    }
                    //pular coordenadas Y
                    coordinateY += 92;
                    //coordenada padrao 55,125
                }


                users.push(idUser); //adicionar User no banco
                cartelaUsers.push(listNumbersSorteados) //adicionar lista no banco

                layout.write(`./cartelafeita/${idUser}.png`, async() => {

                    await message.channel.send("<@" + idUser + "> sua cartela é de número: [ " + numOfCards + " ] boa sorte! :relaxed:  ", { files: [`./cartelafeita/${idUser}.png`] })
                    numOfCards++;
                    await fs.rm(path.resolve(path.dirname('').toString(), 'cartelafeita', `${idUser}.png`))
                })





                channelId.send("---------------------------------------------")
                channelId.send("usuário: " + users[nBanco] + "\nde tag: " + tagUser + "\npossui a cartela de número: " + numOfCards + "\npossui a seguinte lista " + cartelaUsers[nBanco])
                channelId.send("---------------------------------------------")
                nBanco++;


            } else {
                message.channel.send("<@" + idUser + "> não tente pedir outra cartela, espere o jogo atual acabar :pencil: ")
            }
        }

        if (comando === "sortear") {
            if (idUser === "454059471765766156" || "544226820925685770" || "286622177917403136" || "553414151758807064" || "146426367683198977" || "268830734083424259") {
                console.log(tagUser + " sorteou um número")
                let randomNumber = getRandomNumber();

                if (contadorSortear < numbersCount) {
                    while (numSorteados.find(e => e == randomNumber)) {

                        randomNumber = getRandomNumber();

                    }

                    numSorteados.push(randomNumber);


                    message.channel.send("número sorteado: [ " + numSorteados[contadorSortear] + " ] :smirk_cat:  ")

                    contadorSortear++;

                } else {
                    let organizar = numSorteados.sort((a, b) => a - b);
                    message.channel.send("todos os números já foram sorteados e ninguém venceu :zany_face: " + organizar)
                }
            } else {
                message.channel.send("<@" + idUser + "> você não tem permissão para sortear, espere alguém sortear :woozy_face: ")
            }

        }

        if (comando === "consultar") {
            let userHasCard = false; //verificação
            for (let e = 0; e < users.length; e++) {
                if (users[e] === idUser) {
                    userHasCard = true;
                }
            }

            if (userHasCard === true) {


                console.log(tagUser + " solicitou cartela! ")

                for (let r = 0; r < cartelaUsers.length; r++) {
                    if (users[r] === idUser) {

                        message.channel.send("Solicitando sua cartela :arrows_counterclockwise: ")

                        let listUser = cartelaUsers[r];
                        var tamListCartela = cartelaUsers[r].length;
                        var tamListSorteados = numSorteados.length;

                        for (let i = 0; i < tamListCartela; i++) {
                            for (let t = 0; t < tamListSorteados; t++) {
                                if (listUser[i] === numSorteados[t]) {
                                    listUser[i] = null;


                                }

                            }
                        }

                        let layout = await jimp.read('./layout/layout.png')

                        let coordinateY = 125;
                        let contador = 0;
                        let cont = 0;
                        for (let i = 1; i <= 5; i++) {

                            let coordinateX = 55;

                            for (let j = 1; j <= 5; j++) {

                                //pular centro do layout
                                let nulo = false;
                                if (i === 3 && j === 3) {
                                    nulo = true;
                                } else {
                                    nulo = false;
                                }

                                if (!nulo) {
                                    let number = listUser[contador]
                                    if (listUser[contador] !== null) {


                                        layout.composite(list[number - 1], coordinateX, coordinateY)


                                    }
                                    contador++;
                                }
                                //pular coordenadas X
                                coordinateX += 85;

                            }
                            //pular coordenadas Y
                            coordinateY += 92;
                            //coordenada padrao 55,125
                        }
                        layout.write(`./cartelaConsulta/${idUser}.png`, async() => {
                            await message.channel.send("<@" + idUser + "> Aqui está sua cartela atual :eyes: ", { files: [`./cartelaConsulta/${idUser}.png`] })
                        })

                    }
                }

            } else {
                message.channel.send("<@" + idUser + "> você não possui uma cartela, peça com **B>cartela** :wink: ")
            }
        }

        if (comando === "bingo!") {

            let userHasCard = false;
            for (let e = 0; e < users.length; e++) {
                if (users[e] === idUser) {
                    userHasCard = true;
                }
            }
            if (userHasCard === true) {
                console.log(tagUser + " pediu bingo!")
                message.channel.send("Verificando sua cartela :arrows_counterclockwise: ")
                for (let r = 0; r < cartelaUsers.length; r++) {
                    if (users[r] === idUser) {

                        let listUser = cartelaUsers[r];
                        var tamListCartela = cartelaUsers[r].length;
                        var tamListSorteados = numSorteados.length;

                        for (let i = 0; i < tamListCartela; i++) {
                            for (let t = 0; t < tamListSorteados; t++) {
                                if (listUser[i] === numSorteados[t]) {
                                    listUser[i] = null;


                                }

                            }
                        }
                        cartelaUsers[r] = listUser //atualizar lista original do user

                        //verificação se o user realmente ganhou
                        let ganhador = true;
                        for (let q = 0; q < tamListCartela; q++) {
                            if (cartelaUsers[r][q] !== null) {
                                ganhador = false;
                            }

                        }
                        if (ganhador === true) { //verifica se ainda há números dentro da lista

                            console.log("lista vazia, vencedor : " + tagUser)

                            //mensagem vencedor---------------------------

                            let mask = await jimp.read('./vencedor/mask.png')
                            let winner = await jimp.read('./vencedor/winner.png')
                            let avatar = await jimp.read(avatarUser)
                            let font = await jimp.loadFont('./font/DINRundschriftBreit.ttf.fnt')

                            avatar.resize(350, 350)
                            mask.resize(350, 350)
                            avatar.mask(mask)

                            winner.print(font, 210, 745, {
                                    text: nameUser,
                                    size: 40,
                                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                                    alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
                                },
                                1500,
                                70)

                            await winner.composite(avatar, 785, 351).write('./vencedor/ImgWinner.png')
                            positionWinner++;
                            await message.channel.send(":writing_hand: Parabéns <@" + idUser + "> você foi o " + positionWinner + "° vencedor(a)! :star2:", { files: ["./vencedor/ImgWinner.png"] })

                            cartelaUsers.splice(r, 1) //remover jogador
                            users.splice(r, 1)
                        } else {
                            message.channel.send("<@" + idUser + "> calma lá, você ainda não completou todos os números! :no_entry_sign: :x: \nPara saber como está sua cartela, digite **B>consultar** :wink: ")
                        }
                    }
                }
            } else {
                message.channel.send("<@" + idUser + "> você não possui uma cartela, peça com **B>cartela** :wink: ")
            }
        }

        if (comando !== "reiniciar" || comando !== "message" || comando !== "bingo!" || comando !== "consultar" || comando !== "cartela" || comando !== "sortear") {
            if (comando === "reiniciar" || comando === "message" || comando === "bingo!" || comando === "consultar" || comando === "cartela" || comando === "sortear") {
                console.log("comando existe")
            } else {
                console.log("comando desconhecido")
                message.channel.send("<@" + idUser + "> Comando desconhecido :rolling_eyes::pinched_fingers: use um dos seguintes Comandos: \nB>cartela = Solicitar e receber uma cartela única e entrar no bingo!:ticket: \nB>sortear = Sortear um novo número(apenas Moderadores e Adm's) :new: \nB>bingo! = Gritar que é o vencedor e vencer o jogo sobrando nenhum número :partying_face: \nB>reiniciar = Apagar as cartelas e os números sorteados(apenas Moderadores e Adm's) :leftwards_arrow_with_hook: \nB>consultar = Consulte como está sua cartela e quais números foram removidos da sua cartela :pencil:  ")
            }

        }
    }


});

client.login(token);