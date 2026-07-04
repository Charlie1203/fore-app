import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
	card: '#1a1a1a',
	border: '#2a2a2a',
	white: '#f0f0f0',
	muted: '#666',
};

interface AuthTextInputProps extends TextInputProps {
	icon: keyof typeof Ionicons.glyphMap;
	isPassword?: boolean;
}

export default function AuthTextInput({ icon, isPassword, ...props }: AuthTextInputProps) {
	const [visible, setVisible] = useState(false);

	return (
		<View style={styles.row}>
			<View style={styles.leftIconWrap}>
				<Ionicons name={icon} size={18} color={COLORS.muted} />
			</View>
			<TextInput
				style={[styles.input, isPassword && styles.withRightIcon]}
				placeholderTextColor={COLORS.muted}
				secureTextEntry={isPassword && !visible}
				{...props}
			/>
			{isPassword && (
				<TouchableOpacity style={styles.eyeBtn} onPress={() => setVisible((v) => !v)}>
					<Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.muted} />
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { position: 'relative', justifyContent: 'center' },
	input: {
		backgroundColor: COLORS.card,
		borderWidth: 0.5,
		borderColor: COLORS.border,
		borderRadius: 12,
		paddingLeft: 44,
		paddingRight: 16,
		paddingVertical: 14,
		color: COLORS.white,
		fontSize: 15,
	},
	withRightIcon: { paddingRight: 44 },
	leftIconWrap: {
		position: 'absolute',
		left: 14,
		height: '100%',
		justifyContent: 'center',
		zIndex: 1,
	},
	eyeBtn: {
		position: 'absolute',
		right: 14,
		height: '100%',
		justifyContent: 'center',
	},
});
