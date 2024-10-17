import React from 'react';
import {useNavigate, useLocation} from "react-router-dom";
import DesignerView from "./DesignerView";

function DesignerWrapper(){
    // const { roomId, userId } = useParams();
  const location = useLocation()
  const state = location.state
    let navigate  = useNavigate();
    return (
        <div>
            <DesignerView username={state.username} navigate={navigate} />
        </div>
    );
}

export default DesignerWrapper;
