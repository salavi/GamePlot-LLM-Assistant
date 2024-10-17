import './index.css';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import NotFound from "./Components/NotFound";
import HistoryWrapper from "./Components/HistoryWrapper";
import MesgsWrapper from "./Components/MesgsWrapper";
import DesignerWrapper from "./Components/DesignerWrapper"
import SignIn from "./Components/SignIn";

function App() {

    return (
        <div>
            <div>
                <div className="container">
                    <h1 className="text-center">GamePlot</h1>
                    <div className="messaging" id="messaging_id">


                        <Router>
                            <Routes>
                                <Route exact path="/" element={<SignIn/>}/>
                                <Route exact path="/game/:roomId/:userId" element={<MesgsWrapper/>}/>
                                <Route exact path="/designer" element={<DesignerWrapper/>}/>
                                <Route exact path="/history/" element={<HistoryWrapper/>}/>
                                <Route path="*" element={<NotFound/>}/>

                            </Routes>
                        </Router>

                    </div></div>
                
            </div>
        </div>
    );

}

export default App;


// <Route exact path="/chat/:roomId/:userId" element={<MesgsWrapper/>}/>
