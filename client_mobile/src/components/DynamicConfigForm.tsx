import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { Settings } from 'lucide-react-native';
import { Schema, SchemaProperty } from '../types';

interface DynamicConfigFormProps {
    schema: Schema | undefined;
    config: Record<string, any>;
    setConfig: (config: Record<string, any>) => void;
    title: string;
}

const DynamicConfigForm: React.FC<DynamicConfigFormProps> = ({ schema, config, setConfig, title }) => {
    if (!schema?.properties || Object.keys(schema.properties).length === 0) {
        return null;
    }

    const requiredFields = schema.required || [];

    const handleFieldChange = (key: string, value: any) => {
        setConfig({ ...config, [key]: value });
    };

    const renderFormField = (
        key: string,
        prop: SchemaProperty,
        value: any,
        onChange: (val: any) => void,
        required: boolean
    ) => {
        const label = `${key}${required ? ' *' : ''}`;

        if (prop.type === 'boolean') {
            return (
                <View key={key} style={styles.fieldContainer}>
                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>{label}</Text>
                            {prop.description && (
                                <Text style={styles.fieldDescription}>{prop.description}</Text>
                            )}
                        </View>
                        <Switch
                            value={value ?? prop.default ?? false}
                            onValueChange={onChange}
                            trackColor={{ false: "#334155", true: "#2563eb" }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            );
        }

        if (prop.type === 'array' && prop.items?.type === 'string') {
            return (
                <View key={key} style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    {prop.description && (
                        <Text style={styles.fieldDescription}>{prop.description}</Text>
                    )}
                    <TextInput
                        style={styles.fieldInput}
                        placeholder="Comma-separated values"
                        placeholderTextColor="#64748b"
                        value={Array.isArray(value) ? value.join(', ') : (value || '')}
                        onChangeText={(text) => {
                            const arr = text.split(',').map(s => s.trim()).filter(Boolean);
                            onChange(arr.length > 0 ? arr : undefined);
                        }}
                    />
                </View>
            );
        }

        // Default: string input
        return (
            <View key={key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {prop.description && (
                    <Text style={styles.fieldDescription}>{prop.description}</Text>
                )}
                <TextInput
                    style={[styles.fieldInput, key === 'body' && { height: 100, textAlignVertical: 'top' }]}
                    placeholder={prop.example || `Enter ${key}...`}
                    placeholderTextColor="#64748b"
                    value={value || ''}
                    onChangeText={(text) => onChange(text || undefined)}
                    multiline={key === 'body'}
                />
            </View>
        );
    };

    return (
        <View style={styles.configSection}>
            <View style={styles.configHeader}>
                <Settings color="#94a3b8" size={16} />
                <Text style={styles.configTitle}>{title}</Text>
            </View>
            {Object.entries(schema.properties).map(([key, prop]) =>
                renderFormField(
                    key,
                    prop,
                    config?.[key],
                    (val) => handleFieldChange(key, val),
                    requiredFields.includes(key)
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    configSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    configHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    configTitle: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fieldLabel: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    fieldDescription: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 8,
    },
    fieldInput: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minHeight: 44,
    },
});

export default DynamicConfigForm;
