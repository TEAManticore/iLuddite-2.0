const React = require('react');
const Navbar = require('./Navbar');
const EditPage = require('./EditPage');
import { browserHistory } from 'react-router';
const axios = require('../axios');

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      navbarSearchText: '',
      navbarSearchResults: [],
      loggedInUser: {
        
      }
    }
  }

  componentDidMount () {
    // When app mounts check to see if it has a logged in user,
    // if it does then send them to the profile component
    if (this.state.loggedInUser.fbid) {
      const path = `/users/${this.state.loggedInUser.fbid}`;
      browserHistory.push(path);
    } else {
      // component doesn't have a logged in user send request to server to
      // get the loggedIn user information
      axios.get('/loggedin')
        .then((response) => {
          this.setState({
            loggedInUser: response.data
          });
          const path = `/users/${this.state.loggedInUser.fbid}`;
          browserHistory.push(path);
        });
    }
  }

  render () {
    const style = { height: '100vh' };
    return (
      <div style={style}>
        <Navbar 
          changeSearchText={this.changeSearchText.bind(this)}
          loggedInUserId={this.state.loggedInUser.fbid}
          searchText={this.state.navbarSearchText}
          searchResults={this.state.navbarSearchResults}
          handleSearchSubmit={this.searchForBook.bind(this)}
          addBookToQueue={this.addBookToQueue.bind(this)}
          makeCurrentBook={this.makeCurrentBook.bind(this)}
        />
        <div className="container">
          {this.renderChildrenWithProps()}
        </div>
      </div>
    );
  }


  // allow navbar input field to change navbarSearchText
  changeSearchText (newText) {
    this.setState({
      navbarSearchText: newText
    });
  }

  // uses the navbarSearchText to do an api call and search for a book.
  searchForBook () {
    axios.get(`/books/search/${this.state.navbarSearchText}`)
      .then(response => {
        this.setState({
          navbarSearchResults: response.data
        })
      });
  }

  // this function would be needed anytime the user clicks on one of the books
  // in the navbarSearchResults dropdown. In that case the user would get 
  // sent to that book and then the list needs to be destroyed.
  clearSearchResults () {
    this.setState({
      navbarSearchResults: []
    });
  }

  removeBookFromQueue (isbn) {
    // go through current queue and filter out isbn
    const filtered = 
      this.state.loggedInUserQueue.filter(book => book.isbn !== isbn);
    axios.delete(`/users/${this.state.loggedInUser.fbid}/queue/${isbn}`)
      .then(book => {
        const newState = Object.assign({}, this.state.loggedInUser);
        newState.queue = filtered;
        this.setState({
          loggedInUser: newState
        })
      })
  }

  addBookToQueue (isbn) {
    // first check to see if the book is already in the users queue
    for (let i = 0; i < this.state.loggedInUser.queue; i++) {
      if (this.state.loggedInUser.queue[i]._id === isbn) {
        // we already have the isbn return out of function
        // and do nothing
        return;
      }
    }
    // The book is not already in queue post to db to add it
    axios.post(`/users/${this.state.loggedInUser.fbid}/queue/${isbn}`)
    .then( response => {
      const newState = Object.assign({}, this.state.loggedInUser);
      newState.queue = newState.queue.concat(response.data);
      this.setState({
        loggedInUser: newState
      })
    })
  }

  makeCurrentBook (isbn){

    // makes the clicked book your current Book.
    axios.post(`/users/${this.state.loggedInUser.fbid}/queue/${isbn}?current=true`)
    .then( book => {
      book = book.data
      const newState = Object.assign({}, this.state.loggedInUser);
      newState.queue = [book._id].concat(newState.queue);
      this.setState({
        loggedInUser: newState
      })
    })
  }

  removeBookFromFavorites (isbn) {
    // removesBookFromFavorites
    const filtered = 
    this.state.loggedInUserFavorites.filter(book => {
      return book.isbn !== isbn;
    });
    axios.delete(`/users/${userid}/favorites/${isbn}`)

  }

  addBookToFavorites (isbn) {
    axios.post(`/users/${this.state.loggedInUser.fbid}/favorites/${isbn}`)
      .then(book => {
        const newState = Object.assign({}, this.state.loggedInUser);
        newState.favorites = newState.favorites.concat(isbn);
        this.setState({
          loggedInUser: newState
        })
      })
  }

  // This function is used to render out children given to App by router
  // before rendering them we inspect what type of component they are
  // and inject properties into them so that they can display all the data
  // they need.
  renderChildrenWithProps () {
    // loop through the children of App and add properties to component
    // and return a copy of it with new props.
    return React.Children.map(this.props.children, (child) => {
      switch (child.type.name) {
        case "EditPage" :
          return React.cloneElement(child, {
            queue: this.state.loggedInUser.queue,
            favorites: this.state.loggedInUser.favorites
          });
          break;
        case "UserProfile" :
          return React.cloneElement(child, {
            loggedInUser: this.state.loggedInUser
          });
          break;
        default :
          return child;
      }
    });
  }

}

// export the class so other files can work with it.
module.exports = App;
