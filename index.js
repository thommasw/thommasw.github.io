const urlAuthentification = "https://zone01normandie.org/api/auth/signin";
const urlGraph = "https://zone01normandie.org/api/graphql-engine/v1/graphql";

let infoUser;
let allTransactInfo;

let jwtToken;

const credentials = {
    username: '',
    password: '',
};

let TotalProjectXP = 0
let TotalGalaxyProjectXP = 0

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submitButton").addEventListener("click", function() {
        const passwordDIV = document.getElementById("pswlogin");
        const usernameDIV = document.getElementById("email");
        credentials.password = passwordDIV.value;
        credentials.username = usernameDIV.value;
        fetchZone01();
    });
});

function fetchZone01(){
    let login = async function () {
        const headers = new Headers();
        //Basic sert pour envoyer en message des données en base64 
        headers.append('Authorization', 'Basic ' + btoa(credentials.username + ':' + credentials.password));
        try {
          const response = await fetch(urlAuthentification, {
            method: 'POST',
            headers: headers
          });
          const token = await response.json();
          if (response.ok) {
            console.log("ok" ,response)
            jwtToken = token;
        
            console.log(jwtToken)
            fetchUserData();
          } else {
            console.log("wrong password or email", token.message);
            displayError()
          }
        } catch (error) {
          console.error('Error:', error);
        }
    };
    login();
}

async function fetchUserData() {

    fetch(urlGraph, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
            query: `
        query {
            user {
                id
                login
                attrs
                totalUp
                totalDown
                transactions ( where: {eventId: {_eq: 148}}, order_by: {createdAt:asc}){
                amount
                type
                createdAt
                }
            }
            transaction(where: {type: {_eq: "xp"}}){
                id
                type
                amount 	
                objectId 	
                userId 	
                createdAt 	
                path
            }
        }`
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.data.user[0]); // Affiche les données de l'utilisateur dans la console
        infoUser = data.data.user[0];
        allTransactInfo = data.data.transaction;
        createProfilPageUser();
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
    });

}

async function createProfilPageUser(){
    if (infoUser){
        const profil = document.getElementById("profil");
        const xps = document.getElementById("xp")
        const graphs = document.getElementById("graphs")
        const loginPage = document.getElementById("loginpage");

        const sep = Array.from(document.getElementsByClassName("separrator"))
        const deco = document.getElementById("deco")

        deco.style.display = 'block'
        sep.forEach(s =>{
            s.style.display = 'block'
        })
        loginPage.style.display = 'none'
        

        displayUserInfos(profil)
        displayGraphs(graphs)
        displayXpUser(xps)
    }
}

function displayUserInfos(contentPage){

    //informations personnel du profil
    const infoUserPersonnel = document.createElement("div");
    infoUserPersonnel.className="infoUser";
    infoUserPersonnel.textContent = "Informations personnelles:";
    infoUserPersonnel.style.textDecorationColor = "black"
    infoUserPersonnel.style.textDecorationLine = "underline"
    infoUserPersonnel.style.textDecorationStyle = "double"
    infoUserPersonnel.style.marginBottom = "10px"

    //Div username (login) user
    const infoUserLog = document.createElement("div");
    infoUserLog.className="infoUser";
    infoUserLog.textContent=`Username: ${infoUser.login}`;

    //Div phone user
    const infoPhone = document.createElement("div");
    infoPhone.className="infoUser";
    infoPhone.textContent=`Téléphone: ${infoUser.attrs.Phone}`;

    //Div mail user
    const infoUserMail = document.createElement("div");
    infoUserMail.className="infoUser";
    infoUserMail.textContent=`Mail: ${infoUser.attrs.email}`;

    


    contentPage.appendChild(infoUserPersonnel);
    contentPage.appendChild(infoUserLog);
    contentPage.appendChild(infoPhone);
    contentPage.appendChild(infoUserMail);
}

function displayXpUser(page) {

    const levelUser = document.createElement("div");
    levelUser.className = "infoUser";
    levelUser.textContent= `Level: ${findLevelUser()}`;

    const xpUser = document.createElement("div")
    xpUser.className = "xpUser"
    xpUser.textContent = "Total XP: " + String(TotalProjectXP)

    page.appendChild(levelUser)
    page.appendChild(xpUser)
}

function displayGraphs(graphs) {
    document.getElementById("graphs").style.display = ''
    projectsXpGainChart(graphs)
    ratioGraph()
}

function projectsXpGainChart(page){
    var svgNS = "http://www.w3.org/2000/svg"

    const allprojects = allProjects()

    const graph = document.createElementNS(svgNS, "svg")
    graph.classList.add("chart")
    graph.setAttribute("width", "850")
    graph.setAttribute("height", String(allprojects.length * 20))
    graph.role = "img"

    const title = document.createElement("title")
    title.id = "title"
    title.innerHTML = "graphique du gain d'xp par projet"

    const desc = document.createElement("desc")
    desc.id = "desc"
    desc.textContent = "Graphique du gain d'xp par projet."

    graph.appendChild(title)
    graph.appendChild(desc)

    const sortedGraphArray = sortProjects(allprojects)
    let y = 0

    sortedGraphArray.forEach(project =>{
        const width = getProjectWidth(project)

        const g = document.createElementNS(svgNS, "g")
        g.classList.add("bar")

        const rect = document.createElementNS(svgNS, "rect")
        rect.setAttribute("width", String(width))
        rect.setAttribute("height", "19")
        rect.setAttribute("y", String(y))

        const text = document.createElementNS(svgNS, "text")
        text.setAttribute("x", String(width + 5))
        text.setAttribute("y", String(y + 8))
        text.setAttribute("dy", ".35em")
        
        const name = getProjectName(project)
        const XPamount = getProjectXP(project)
        text.innerHTML = name + " : " + XPamount + " XP"

        g.appendChild(rect)
        g.appendChild(text)
        graph.appendChild(g)

        y += 20
    })
    

    page.appendChild(graph)

}

function allProjects() {
    let all = []
    
    allTransactInfo.forEach(p =>{

        if(p.path.includes("div-01") && !p.path.includes("piscine-js-retry") && !p.path.includes("checkpoint") && !p.path.includes("piscine-go") && !p.path.includes("piscine-js")){
            TotalProjectXP += p.amount
            if(p.path != "/rouen/div-01"){
                TotalGalaxyProjectXP += p.amount
                all.push(p)
            }
        }
    })
    
    return all
}

function getProjectWidth(project) {
    const xp = project.amount
    
    return (850 * ((Math.round((((xp * 100) / TotalGalaxyProjectXP)))) / 100))
}

function getProjectName(project) {
    const path = project.path

    return path.replace("/rouen/div-01/", '')
}

function getProjectXP(project) {
    const amount = project.amount

    return Math.round(amount)
}

function sortProjects(arr){
    return arr.sort((a, b) => a.amount - b.amount)
}

function findLevelUser(){

    let level;

    for (let i = 0; i < infoUser.transactions.length-1; i++){
        if (infoUser.transactions[i].type === "level"){
            level = infoUser.transactions[i].amount
        }
    }

    return level
}


function transactionsEXP(){
    let array = [];
    for(let i = 0; i < infoUser.transactions.length-1; i++){
        if (infoUser.transactions[i].type ==="xp"){
            array.push(Number(infoUser.transactions[i].amount))
        }
    }
    return array
}

let timeout;
function displayError(){
    clearTimeout(timeout);
    const error = document.getElementById("errorlog");
    error.textContent="Error wrong password or username"
    timeout = setTimeout(()=>{
        error.textContent=""
    },2000);
}

function ratioGraph() {
    const up = document.getElementById("up");
    const down = document.getElementById("down");

    document.getElementById('textUp').textContent = "Done : " + infoUser.totalUp + " XP"
    document.getElementById('textDown').textContent = "Received : " + infoUser.totalDown + " XP"

    const nb = Number(infoUser.totalUp / infoUser.totalDown).toFixed(1)
    const widthUp = 400 * infoUser.totalUp / 1000000;
    const widthDown = 400 * infoUser.totalDown / 1000000;
    up.setAttribute("width", widthUp);
    down.setAttribute("width", widthDown);

    document.getElementById('ratio').textContent = "Ratio Audit : " + nb
}