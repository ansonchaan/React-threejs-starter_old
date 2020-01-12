import { print } from '../globalFunc';


const initalState = {
    language: 'en',
    count: 0
}

const Reducer = (state = initalState, action) => {
    switch(action.type){
        case 'UPDATE_LANGUAGE':
            const newLanguage = state.language === 'en' ? 'zh' : 'en';
            print(action.type, 'green', newLanguage)
            return { ...state, language: newLanguage }
        case 'ADD_COUNT':
            print(action.type, 'green', state.count + 1)
            return { ...state, count: state.count + 1 }
        default:
            return state;
    }
}

export default Reducer;