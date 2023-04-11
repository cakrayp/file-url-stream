const jwt = require("jsonwebtoken");

const ACTIVATION_TOKEN = "3yl-qBj!Dgl7Kx5E9=!ZYt9eKf8R6clU&!x529#+@hKL1vYEJnUaaS0HM00eNVtZtW/Bd";
const makeToken = jwt.sign({ url: "https://v16-webapp-prime.tiktok.com/video/tos/useast2a/tos-useast2a-pve-0037-aiso/ocxGK1RPyInDBlhMoAAfJ8AhUozQlIAZ4otoRU/?a=1988&ch=0&cr=0&dr=0&lr=tiktok&cd=0%7C0%7C1%7C0&cv=1&br=3912&bt=1956&cs=0&ds=3&ft=_RwJrB~Fq8Zmo68qFc_vjtW87AhLrus&mime_type=video_mp4&qs=0&rc=NWVkOTppZDs7PGkzNjdnZ0Bpams0b2Y6ZnZkajMzZjgzM0A1MjUzYmFiNS0xNl5eLTU1YSM1ZzJmcjRfLTBgLS1kL2Nzcw%3D%3D&btag=80000&expire=1680961539&l=20230408074523E8DAB93F9B82A034D694&ply_type=2&policy=2&signature=a7bd7356b316fbb3bd41178477fbbbe8&tk=tt_chain_token " }, ACTIVATION_TOKEN, { expiresIn: "1h" })


console.log(btoa(makeToken))