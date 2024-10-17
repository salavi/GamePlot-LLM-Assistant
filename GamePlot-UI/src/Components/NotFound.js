import React from 'react'
import {Link} from "react-router-dom";
import './notfound.css'


class NotFound extends React.Component{

    render(){
        return(
            <div className="inbox_msg1">


                <h1>404 - Not Found!</h1>
                <Link to="/">Go Home</Link>
            </div>
        );
    }
}

export default NotFound