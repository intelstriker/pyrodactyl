import styled from 'styled-components';

const MainSidebar = styled.nav`
    width: 300px;
    flex-direction: column;
    shrink: 0;
    border-radius: 8px;
    overflow-x: hidden;
    padding: 32px;
    // position: absolute;
    margin-right: 8px;
    user-select: none;
    background: rgba(20, 5, 35, 0.55);
    border: 1px solid rgba(168, 85, 247, 0.15);

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

            &.active {
                color: var(--color-brand);
                fill: var(--color-brand);
            }
        }
    }
`;

export default MainSidebar;
