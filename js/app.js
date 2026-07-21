const params = new URLSearchParams(window.location.search);

const inviteID = params.get("id");


const guests = {

"SJ8-0001":{
name:"Ahmad Khaled"
},

"SJ8-0002":{
name:"Sara Ali"
},

"SJ8-0003":{
name:"Omar Nasser"
}


};


if(guests[inviteID]){

document.getElementById("inviteName").innerHTML =
guests[inviteID].name + ", you are invited";

document.getElementById("name").value =
guests[inviteID].name;


}
else{

document.getElementById("inviteName").innerHTML =
"Invalid Invitation";

}