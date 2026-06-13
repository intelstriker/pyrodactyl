import styled from 'styled-components';

const MainSidebar = styled.nav`
    width: 300px;
    flex-direction: column;
    shrink: 0;
    border-radius: 8px;
    overflow-x: hidden;
    padding: 32px;
    margin-right: 8px;
    user-select: none;
    background: rgba(14, 3, 26, 0.75);
    border: 1px solid rgba(168, 85, 247, 0.15);
    backdrop-filter: blur(12px);
    box-shadow: 0 0 40px rgba(168, 85, 247, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.04);

    & > .pyro-subnav-routes-wrapper {
        display: flex;
        flex-direction: column;
        font-size: 14px;

        & > a,
        & > div {
            display: flex;
            position: relative;
            padding: 16px 0;
            gap: 8px;
            font-weight: 600;
            min-height: 56px;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            user-drag: none;
            -ms-user-drag: none;
            -moz-user-drag: none;
            -webkit-user-drag: none;
            transition: 200ms all ease-in-out;
            color: rgba(216, 180, 254, 0.5);

            &:hover {
                color: rgba(216, 180, 254, 0.9);
            }

            &.active {
                color: #d8b4fe;
                fill: #d8b4fe;
            }
        }
    }
`;

export default MainSidebar;
