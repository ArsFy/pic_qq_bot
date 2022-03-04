const config = require("./config.json");
const fs = require('fs');
const axios = require('axios');
const { createClient, User } = require("oicq");
const client = createClient(config.qq);

const getRandomInt = (min, max)=>{
    let min_num = Math.ceil(min);
    let max_num = Math.floor(max);
    return Math.floor(Math.random() * (max_num - min_num)) + min_num;
}

const getImgFile = (url, filename)=>{
    axios({
        url: url,
        responseType: 'arraybuffer',
    }).then(({data})=>{
        fs.writeFileSync(`./pic/${filename}`, data, 'binary');
    })
}

let getMsg = {"status": false, "uid": 0, "even": ""};
const clearMsg = ()=>{
    getMsg = {"status": false, "uid": 0, "even": ""};
}

client.on("system.online", () => console.log("Logged in!"));
client.on("message", async (e) => {
    // Even
    if (getMsg.status){
        if (getMsg.uid == e.sender.user_id){
            switch (getMsg.even) {
                case "add":
                    if (e.message[0].type == "image"){
                        getImgFile(e.message[0].url, e.message[0].file)
                        e.reply("已添加到图片库！", true);
                        clearMsg();
                    }else{
                        e.reply("请发送图片！添加任务已取消", true);
                        clearMsg();
                    }
                    break;
                case "adds":
                    if (e.message[0].type == "image"){
                        getImgFile(e.message[0].url, e.message[0].file)
                        e.reply("已添加到图片库！", true);
                    }else{
                        if (e.message[0].text == "/结束添加"){
                            e.reply("添加任务已结束", true);
                            clearMsg();
                        }else{
                            e.reply("请发送图片！（使用 \"/结束添加\" 结束）", true);
                        }
                    }
                    break;
            }
        }
    }
    // Command
    switch (e.message[0].type) {
        case "text":
            let msg_list = e.message[0].text.split(" ");
            switch (msg_list[0]) {
                case "/帮助":
                    e.reply("这是一个色色Bot！你可以用它得到色色的二次元图（可能有些并不色）\n指令：\n\"/色色\" 随机图\n\"/添加\" 添加新图（管理员）\n\"/批量添加\" 批量添加新图，使用 \"结束添加\" 结束 (管理员）\n\"/添加管理员 管理员QQ号或直接回复消息\" 添加管理员\n\"/删除管理员 管理员QQ号或直接回复消息\" 删除管理员\n\"/图库数量\" 查看库里有多少张图", true);
                    break;
                case "/色色":
                    let pic_list = fs.readdirSync('./pic');
                    if (pic_list.length != 0){
                        e.reply("呼呼，色色来咯！", false);
                        e.reply([
                            {
                              type: 'image',
                              file: fs.readFileSync(`pic/${pic_list[getRandomInt(0, pic_list.length)]}`)
                            }
                        ], false);
                    }else{
                        e.reply("图库里没有图片，暂时不能色色哦", true);
                    }
                    break;
                case "/添加":
                    if (config.admin.indexOf(e.sender.user_id) != -1){
                        e.reply("请发送一张图片！", true);
                        getMsg = {"status": true, "uid": e.sender.user_id, "even": "add"};
                    }else{
                        e.reply("你没有管理员权限哦！", true);
                    }
                    break
                case "/批量添加":
                    if (config.admin.indexOf(e.sender.user_id) != -1){
                        e.reply("请发送图片！（一张一张发）", true);
                        getMsg = {"status": true, "uid": e.sender.user_id, "even": "adds"};
                    }else{
                        e.reply("你没有管理员权限哦！", true);
                    }
                    break
                case "/添加管理员":
                    if (config.admin.indexOf(e.sender.user_id) != -1){
                        const addAdmin = (qq)=>{
                            config.admin.push(qq);
                            fs.writeFileSync("./config.json", JSON.stringify(config));
                            e.reply(`添加管理员：${qq}`, true);
                        }
                        if (msg_list[1] != undefined){
                            addAdmin(Number(msg_list[1]));
                        }else{
                            if (e.source != undefined){
                                addAdmin(e.source.user_id);
                            }else{
                                e.reply("请在命令后面添加管理员QQ或者回复一条消息！", true);
                            }
                        }
                    }else{
                        e.reply("你没有管理员权限哦！", true);
                    }
                    break
                case "/删除管理员":
                    if (config.admin.indexOf(e.sender.user_id) != -1){
                        const addAdmin = (qq)=>{
                            let index = config.admin.indexOf(qq);
                            if (index != -1){
                                config.admin.splice(index, 1);
                                e.reply(`删除管理员：${qq}`, true);
                            }else{
                                e.reply(`不存在的管理员：${qq}`, true);
                            }
                            fs.writeFileSync("./config.json", JSON.stringify(config));
                        }
                        if (msg_list[1] != undefined){
                            addAdmin(Number(msg_list[1]));
                        }else{
                            if (e.source != undefined){
                                addAdmin(e.source.user_id);
                            }else{
                                e.reply("请在命令后面添加管理员QQ或者回复一条消息！", true);
                            }
                        }
                    }else{
                        e.reply("你没有管理员权限哦！", true);
                    }
                    break
                case "/管理员列表":
                    let msgStr = "管理员列表：\n";
                    for (let i in config.admin){
                        msgStr += `${config.admin[i]}\n`
                    }
                    e.reply(msgStr, true);
                    break
                case "/图库数量":
                    let pic_list = fs.readdirSync('./pic');
                    e.reply(`现在有 ${pic_list.length} 张图可以色色！`, true);
                    break
            }
            break;
    };
});

client.on("system.login.qrcode", function (e) {
    process.stdin.once("data", () => {
        this.login();
    });
}).login();
