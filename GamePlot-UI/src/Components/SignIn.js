import './signIn.css'
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MDBContainer,
  MDBInput,
  MDBBtn,
}
from 'mdb-react-ui-kit';
import toast, { Toaster } from 'react-hot-toast';
import {showErrorToast} from "./toastUtils";
import {parseFeedbackFeatures} from "./MesgsWrapper"

// const SERVER = "http://localhost:8000";
const SERVER = process.env.REACT_APP_BACKEND_HOST_HTTP;
// console.log(process.env)
// const SERVER = 'https://gameplot-server.azurewebsites.net';

function SignIn() {
  const [username, setUsername] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomPass, setRoomPass] = useState('');
  const [designerUsername, setDesignerUsername] = useState('');
  let navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'NPC'){
      showErrorToast("Please pick a different username")
      return
    }
    // console.log("player")
    let is_designer = false
    if (roomNumber == '' && roomPass ==''){
      is_designer = true
    }
    const {posFeatures, negFeatures} = parseFeedbackFeatures("")
    fetch( SERVER +'/create-room', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "username": username,
        "room_number": roomNumber,
        "room_pass": roomPass,
        "feedback_features": {"posFeatures": posFeatures, "negFeatures": negFeatures}
        // "is_designer": is_designer
      }),
    }).then((response) => response.json())
      .then((response) => {
        if (response['message'] == 'OK'){
          let data = JSON.parse(response["data"])
          navigate('/game/${room_number}/${username}', {state:{room_number: data['room_number'],
                username: data['username'],
                room_pass:data['room_pass'],
                is_designer: is_designer}})
        }else {
              showErrorToast(response.message)
        }
      })
      .catch((error) => console.error('Error:', error));
  };

  const handleDesignerLogin = (e) => {
   e.preventDefault();
    if (designerUsername === 'NPC'){
      showErrorToast("Please pick a different username")
      return
    }
    navigate('/designer/', {state:{username: designerUsername}})
  }


  return (

  <div className="outline">
      <form className="row g-3" onSubmit={handleLogin}>
                <h3> Join a game!</h3>
                <p>Please enter your Username, Room Number, and Room Pass to enter the Game.
                  <br></br>
                  Leave the Room Number and Room Pass blank if you don't have one.
                  {/*<br></br>*/}
                  {/*We will create a new room with default NPCs for you.*/}
                </p>
       {/*</div>*/}
     <MDBContainer className="p-3 my-1 d-flex flex-column w-50">

      <MDBInput wrapperClass='mb-4' label='Username *' id='form1' type='text' required value={username} onChange={(e) => setUsername(e.target.value)}/>
      <MDBInput wrapperClass='mb-4' label='Room Number' id='form3' type='decimal' value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}/>
       <MDBInput wrapperClass='mb-4' label="Room Pass" id='form2' type='password' value={roomPass} onChange={(e) => setRoomPass(e.target.value)}/>

      <MDBBtn className="mb-4">Join a room</MDBBtn>
       <Toaster position="top-right" reverseOrder={false} />

    </MDBContainer>

    </form>

    <form className="row g-3" onSubmit={handleDesignerLogin}>
    <h3 style={{ whiteSpace: 'pre-wrap' }}>
        OR
      <br></br>
      Enter the Game Designer mode!
    </h3>



          <MDBContainer className="p-3 my-1 d-flex flex-column w-50">
            {/*<Link to="/notfound">*/}
            <MDBInput wrapperClass='mb-4' label='Username *' id='form1' type='text' required value={designerUsername} onChange={(e) => setDesignerUsername(e.target.value)}/>
            <MDBBtn color='danger' className="mb-4">Game Designer</MDBBtn>
              {/*</Link>*/}
            </MDBContainer>
    </form>


  </div>

  );
}

export default SignIn;
