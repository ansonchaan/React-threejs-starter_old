import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { adjustFontSize } from './globalFunc';
import AsyncLoadComponent from './Component/AsyncLoadComponent';

// Async to load component
const Nav = AsyncLoadComponent(import('./Component/Nav'));
const Home = AsyncLoadComponent(import('./Component/page/Home'));
const About = AsyncLoadComponent(import('./Component/page/About'));

const App = () => {
  const language = useSelector(state => state.language);

  const resize = () => {
    adjustFontSize();
  }

  useEffect(()=>{
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    }
  },[]);

  return (
    <Router>
      <Route exact path="/:language?/:section?/"
        render={ props => {
          if(!/^(en|zh)$/.test(props.match.params.language)){
            return <Redirect from="*" to={`/${language}/`} />
          }
          
          return(
            <div id="bodyWrap" className={`body_wrap ${language}`}>
              <Nav {...props} />
              <Switch>
                <Route exact path="/:language/" component={Home} />
                <Route exact path="/:language/about/" component={About} />
                <Redirect from="*" to={`/${language}/`} />
              </Switch>
            </div>
          )
        }
      }>
      </Route>
    </Router>
  );
}

export default App;
