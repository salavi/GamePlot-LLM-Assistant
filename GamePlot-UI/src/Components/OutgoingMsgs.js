import React from 'react'
import '../index.css';

class OutgoingMsgs extends React.Component{

    constructor(props) {
        super(props);
        let today = new Date()
        this.message_id = props.message_id
        if (this.props.message_id !== undefined)
            today = new Date(this.props.message_id)
        this.time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        this.date = today.toLocaleDateString('en-us',{day:'numeric',month:'short', year:'numeric'})
    }

    render(){
        return(
            <div className="outgoing_msg" id={this.props.message_id}>
                <div className="sent_msg">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{this.props.text}</p>
                    <span className="time_date"> {this.time}   | {this.date}</span></div>
            </div>
        );
    }
}

export default OutgoingMsgs
