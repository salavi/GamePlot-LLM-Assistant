import React from 'react'

class InitialPrompt extends React.Component{

    render(){
        return(
            <div className='messages1'>
            <div className="outgoing_msg1">
                <div className="initial_prompt">
                    <h5>NPC Persona:</h5>
                    <p>{this.props.text}</p>
                    </div>
            </div>
            </div>
        );
    }
}

export default InitialPrompt