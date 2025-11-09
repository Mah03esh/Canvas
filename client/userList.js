// handles the online users list UI
export class UserList {
  constructor(listId) {
    this.listElement = document.getElementById(listId);
  }

  update(userArray) {
    if (!this.listElement) {
      return; // element doesn't exist
    }
    
    // wipe existing list
    this.listElement.innerHTML = '';
    
    // rebuild the list
    userArray.forEach((user) => {
      const listItem = document.createElement('li');
      
      // create colored indicator dot
      const dot = document.createElement('span');
      dot.className = 'user-color-swatch';
      dot.style.backgroundColor = user.color;
      
      // show username
      const userName = user.username;
      
      listItem.appendChild(dot);
      listItem.appendChild(document.createTextNode(userName));
      this.listElement.appendChild(listItem);
    });
  }
}
