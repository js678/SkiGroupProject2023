
function editData() {
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const edit = document.getElementById("edit");

    if (username.disabled) {
        edit.textContent = "Cancel";
        username.disabled = false;
        email.disabled = false;
    } else {
        edit.textContent = "Edit";
        username.disabled = true;
        email.disabled = true;
    }
}

function editDataUpdate() {
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const edit = document.getElementById("edit");

    edit.textContent = "Edit";
    username.disabled = true;
    email.disabled = true;
}