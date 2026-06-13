import styled from 'styled-components';

const MainWrapper = styled.div`
    @keyframes obsidian-bg-drift {
        0%, 100% { background-position: 50% -10.55%, 0% 0%, 100% 100%; }
        50% { background-position: 50% -10.55%, 8% 4%, 92% 96%; }
    }

    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 0.375rem;
    overflow: hidden;
    background:
        radial-gradient(124.75% 124.75% at 50.01% -10.55%, #1a0a2e 0%, #05010a 100%),
        radial-gradient(35% 35% at 0% 0%, rgba(168,85,247,0.10) 0%, transparent 70%),
        radial-gradient(35% 35% at 100% 100%, rgba(126,34,206,0.10) 0%, transparent 70%);
    background-size: 100% 100%, 60% 60%, 60% 60%;
    background-repeat: no-repeat;
    animation: obsidian-bg-drift 30s ease-in-out infinite;
`;

export default MainWrapper;
