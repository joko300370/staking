import React from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';

import { walletAddressState } from 'store/wallet';
import { ExternalLink } from 'styles/common';
import styled from 'styled-components';
import Connector from 'containers/Connector';
import Button from 'components/Button';
import Currency from 'components/Currency';
import { Synths } from 'constants/currency';
import synthetix from 'lib/synthetix';
import { tx } from 'utils/transactions';
import { formatNumber, toBigNumber, formatUnits } from 'utils/formatters/number';
import Loans from 'containers/Loans';
import InfoSVG from 'sections/loans/components/ActionBox/components/InfoSVG';

const InfoBox: React.FC = () => {
	const { t } = useTranslation();
	const address = useRecoilValue(walletAddressState);
	const { provider } = Connector.useContainer();
	const { pendingWithdrawals, reloadPendingWithdrawals, ethLoanContract } = Loans.useContainer();
	const [isClaimingPendingWithdrawals, setIsClaimingPendingWithdrawals] = React.useState(false);

	const [borrows, setBorrows] = React.useState<Array<any>>([]);
	const borrowsOpenInterest = React.useMemo(
		() => borrows.reduce((sum, stat) => sum.plus(stat.openInterest), toBigNumber(0)),
		[borrows]
	);

	const claimPendingWithdrawals = async () => {
		if (!ethLoanContract) return;
		try {
			setIsClaimingPendingWithdrawals(true);
			const pw = await ethLoanContract.pendingWithdrawals(address);
			await tx(() => [ethLoanContract, 'claim', [pw]]);
			await reloadPendingWithdrawals();
		} catch {
		} finally {
			setIsClaimingPendingWithdrawals(false);
		}
	};

	React.useEffect(() => {
		if (!provider) {
			return;
		}

		const {
			contracts: {
				ExchangeRates: exchangeRatesContract,
				CollateralManager: collateralManagerContract,
			},
		} = synthetix.js!;

		let isMounted = true;
		const unsubs: Array<Function> = [() => (isMounted = false)];

		const getBorrowStats = async (currency: string) => {
			const [openInterest, [assetUSDPrice]] = await Promise.all([
				collateralManagerContract.long(ethers.utils.formatBytes32String(currency)),
				exchangeRatesContract.rateAndInvalid(ethers.utils.formatBytes32String(currency)),
			]);
			const openInterestUSD = toBigNumber(openInterest.toString())
				.dividedBy(1e18)
				.multipliedBy(toBigNumber(assetUSDPrice.toString()).dividedBy(1e18));
			return {
				currency,
				openInterest: openInterestUSD,
			};
		};

		const loadBorrowsStats = () =>
			Promise.all([Synths.sBTC, Synths.sETH, Synths.sUSD].map(getBorrowStats));

		const load = async () => {
			try {
				const borrows = await loadBorrowsStats();
				if (isMounted) {
					setBorrows(borrows);
				}
			} catch (e) {
				console.error(e);
			}
		};

		const subscribe = () => {
			const newBlockEvent = 'block';
			provider!.on(newBlockEvent, load);
			unsubs.push(() => provider!.off(newBlockEvent, load));
		};

		load();
		subscribe();
		return () => {
			unsubs.forEach((unsub) => unsub());
		};
	}, [provider]);

	return (
		<Root>
			<Container>
				<ContainerHeader>
					<Title>{t('loans.info.title')}</Title>
					<Subtitle>
						{t('loans.info.subtitle')}{' '}
						<ExternalLink href="https://sips.synthetix.io/sips/sip-97">
							{t('loans.info.learn-more')}
						</ExternalLink>
					</Subtitle>
				</ContainerHeader>
			</Container>

			<Container>
				<ContainerHeader>
					<PendingWithdrawalsTitle>
						{t('loans.pending-withdrawals.title')}{' '}
						<InfoSVG tip={t('loans.pending-withdrawals.title-tip')} />
					</PendingWithdrawalsTitle>
					<PendingWithdrawalsSubtitle>
						{pendingWithdrawals.isZero() ? (
							<>{t('loans.pending-withdrawals.empty')}</>
						) : (
							<>
								{formatUnits(pendingWithdrawals, 18)}ETH{' '}
								<ClaimButton
									variant="secondary"
									size="sm"
									onClick={claimPendingWithdrawals}
									disabled={isClaimingPendingWithdrawals}
								>
									{t(
										`loans.pending-withdrawals.${
											isClaimingPendingWithdrawals ? 'claiming' : 'claim'
										}`
									)}
								</ClaimButton>
							</>
						)}
					</PendingWithdrawalsSubtitle>
				</ContainerHeader>
			</Container>

			<Container>
				<ContainerHeader>
					<Title>{t('loans.stats.title')}</Title>
				</ContainerHeader>
				<StatsGrid>
					<StatsHeader>
						<div>{t('loans.stats.asset')}</div>
					</StatsHeader>
					<StatsHeader>
						<div>{t('loans.stats.open-interest')}</div>
					</StatsHeader>
					{borrows.map((stat) => (
						<React.Fragment key={stat.currency}>
							<StatsCol>
								<div>
									<Currency.Name currencyKey={stat.currency} showIcon={true} />
								</div>
							</StatsCol>
							<StatsCol>
								<div>${formatNumber(stat.openInterest, { decimals: 2 })}</div>
							</StatsCol>
						</React.Fragment>
					))}
					<TotalColHeading>
						<div>{t('loans.stats.total')}</div>
					</TotalColHeading>
					<StatsCol>
						<div>${formatNumber(borrowsOpenInterest, { decimals: 2 })}</div>
					</StatsCol>
				</StatsGrid>
			</Container>
		</Root>
	);
};

export default InfoBox;

//

export const Root = styled.div`
	& > div {
		margin-bottom: 32px;
	}

	a,
	a:visited {
		color: ${(props) => props.theme.colors.blue};
		text-decoration: none;
	}
`;

export const Container = styled.div`
	background: ${(props) => props.theme.colors.navy};
`;

export const ContainerHeader = styled.div`
	padding: 16px;
`;

export const Title = styled.div`
	font-family: ${(props) => props.theme.fonts.extended};
	color: ${(props) => props.theme.colors.white};
	font-size: 14px;
`;
export const Subtitle = styled.div`
	font-family: ${(props) => props.theme.fonts.regular};
	color: ${(props) => props.theme.colors.gray};
	font-size: 14px;
	margin-top: 12px;
`;

export const StatsGrid = styled.div`
	display: grid;
	grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
	grid-template-columns: 1fr 1fr;
	font-size: 14px;
	padding: 0 0 16px 0;
`;

export const StatsRow = styled.div``;

export const StatsHeader = styled.div`
	color: ${(props) => props.theme.colors.gray};
	border-top: 1px solid ${(props) => props.theme.colors.grayBlue};
	border-bottom: 1px solid ${(props) => props.theme.colors.grayBlue};
	font-family: ${(props) => props.theme.fonts.interBold};

	&:nth-child(even) {
		text-align: right;
	}

	& > div {
		padding: 8px 16px;
	}
`;

export const StatsCol = styled.div`
	&:nth-child(odd) {
		margin-left: 16px;
	}

	&:nth-child(even) {
		margin-right: 16px;

		& div {
			justify-content: flex-end;
		}
	}

	& > div {
		padding: 8px 0;
		height: 100%;
		display: flex;
		align-items: center;
		border-bottom: 1px solid ${(props) => props.theme.colors.grayBlue};
	}
`;

export const TotalColHeading = styled(StatsCol)`
	color: ${(props) => props.theme.colors.gray};
`;

export const ClaimButton = styled(Button)`
	cursor: pointer;
	margin-left: 50px;
`;

export const PendingWithdrawalsTitle = styled.div`
	font-family: ${(props) => props.theme.fonts.regular};
	color: ${(props) => props.theme.colors.gray};
	font-weight: bold;
	font-size: 12px;
	text-transform: uppercase;
	display: flex;
	align-items: center;

	svg {
		margin-left: 10px;
	}
`;

export const PendingWithdrawalsSubtitle = styled.div`
	font-family: ${(props) => props.theme.fonts.extended};
	color: ${(props) => props.theme.colors.white};
	font-size: 20px;
	margin-top: 12px;
	display: flex;
	align-items: center;
`;
