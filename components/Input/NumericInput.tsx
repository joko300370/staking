import { ChangeEvent, FC } from 'react';
import styled from 'styled-components';

import Input from './Input';

type NumericInputProps = {
	value: string | number;
	placeholder?: string;
	onChange: (e: ChangeEvent<HTMLInputElement>, value: string) => void;
	className?: string;
	disabled?: boolean;
};

const INVALID_CHARS = ['-', '+', 'e'];

const NumericInput: FC<NumericInputProps> = ({
	value,
	onChange,
	placeholder,
	className,
	...rest
}) => {
	const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;

		onChange(e, value.replace(/,/g, '.').replace(/[e+-]/gi, ''));
	};

	return (
		<StyledInput
			{...rest}
			value={value}
			type="number"
			onChange={handleOnChange}
			placeholder={placeholder}
			className={className}
			onKeyDown={(e) => {
				if (INVALID_CHARS.includes(e.key)) {
					e.preventDefault();
				}
			}}
			min="0"
		/>
	);
};

export const StyledInput = styled(Input)`
	font-family: ${(props) => props.theme.fonts.mono};
	text-overflow: ellipsis;
`;

export default NumericInput;
