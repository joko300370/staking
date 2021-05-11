import { FC } from 'react';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';
import { Trans, useTranslation } from 'react-i18next';

import { MOBILE_BODY_PADDING } from 'constants/ui';
import { LOCAL_STORAGE_KEYS } from 'constants/storage';
import UIContainer from 'containers/UI';
import { FlexDivCentered, FlexDivCol, ExternalLink } from 'styles/common';
import media from 'styles/media';
import { DesktopOnlyView, MobileOrTabletView } from 'components/Media';
import TitleIcon from 'assets/svg/app/menu-hamburger-white.svg';
import Banner from 'sections/shared/Layout/Banner';
import UserMenu from './UserMenu';

const Header: FC = () => {
	const { t } = useTranslation();
	const { showMobileSideNav, headerTitle, headerSubtitle } = UIContainer.useContainer();

	return (
		<HeaderWrapper>
			<DesktopOnlyView>
				<Banner
					localStorageKey={LOCAL_STORAGE_KEYS.WARNING_URL_BANNER_VISIBLE}
					message={
						<Trans
							i18nKey={'user-menu.banner.warning-url'}
							components={[<StyledExternalLink href="https://staking.synthetix.io" />]}
						/>
					}
				/>
			</DesktopOnlyView>
			<Container>
				<FlexDivCentered>
					<MobileOrTabletView>
						<Title onClick={showMobileSideNav}>
							<Svg src={TitleIcon} />
							<TitleText hasSubTitle={!!headerSubtitle}>{t(`header.${headerTitle}`)}</TitleText>
							{!headerSubtitle ? null : (
								<>
									<TitleSep>|</TitleSep>
									<SubtitleText>{t(`header.${headerTitle}/${headerSubtitle}`)}</SubtitleText>
								</>
							)}
						</Title>
					</MobileOrTabletView>
					<Sep />
					<UserMenu />
				</FlexDivCentered>
			</Container>
		</HeaderWrapper>
	);
};

const HeaderWrapper = styled.div`
	position: relative;
`;

const Container = styled(FlexDivCol)`
	padding: 24px 30px 0 0;

	${media.lessThan('mdUp')`
		padding: 10px ${MOBILE_BODY_PADDING}px 0;
	`}
`;

const Title = styled.div`
	display: flex;
	align-items: center;
	cursor: pointer;
	font-family: ${(props) => props.theme.fonts.condensedMedium};
	font-size: 12px;
	text-transform: uppercase;
	color: ${(props) => props.theme.colors.gray};

	svg {
		margin-right: 10px;
	}
`;

const TitleText = styled.div<{ hasSubTitle: boolean }>`
	color: ${(props) => (props.hasSubTitle ? props.theme.colors.gray : props.theme.colors.blue)};
`;

const TitleSep = styled.div`
	padding: 0 5px;
`;

const SubtitleText = styled.div`
	color: ${(props) => props.theme.colors.blue};
`;

const Sep = styled.div`
	flex: 1;
`;

const StyledExternalLink = styled(ExternalLink)`
	color: ${(props) => props.theme.colors.white};
	text-decoration: underline;
	&:hover {
		text-decoration: underline;
	}
`;

export default Header;
