
const params = new URLSearchParams(window.location.search);

const guest = params.get("name");


if(guest){

document.getElementById("inviteName").innerHTML =
guest + ", you are invited";

document.getElementById("name").value = guest;

}



function acceptInvite(){

document.getElementById("formBox").style.display="block";

}



function declineInvite(){

window.location.href="decline.html";

}
