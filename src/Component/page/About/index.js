import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SmoothScroll } from '../../../globalFunc';
import './about.scss';

const About = props => {
    const count = useSelector(state => state.count);

    useEffect(()=>{ 
        let smooth = new SmoothScroll('#scrollWrap',(s, y, h) => {});
        smooth.on();
        smooth.showScrollBar();

        return () => {
            smooth.hideScrollBar();
            smooth.off();
            smooth = null;
        }
    },[])

    return (
        <div id="about">
            <div id="scrollWrap">
                About {count}
            </div>
        </div>
    )
}

export default About;