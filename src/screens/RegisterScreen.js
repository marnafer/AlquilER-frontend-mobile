import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { register } from '../services/api';

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        password_confirm: '',
        telefono: '',
        domicilio: ''
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigation = useNavigation();

    const primerErrorValidacion = (result) => {
        const validationErrors = result?.validation_errors;
        if (!validationErrors) return '';
        const primerCampo = Object.values(validationErrors)[0];
        return Array.isArray(primerCampo) && primerCampo.length > 0 ? primerCampo[0] : '';
    };

    // En React Native no existe el evento 'e', pasamos el nombre del campo y el texto directamente
    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async () => {
        // No hay e.preventDefault() en React Native
        setError('');
        setLoading(true);

        if (formData.password !== formData.password_confirm) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        const telefonoDigitos = (formData.telefono || '').replace(/\D/g, '');
        if (telefonoDigitos.length < 6) {
            setError('El teléfono debe tener al menos 6 dígitos');
            setLoading(false);
            return;
        }
        
        if (telefonoDigitos.length > 15) {
            setError('El teléfono no puede superar los 15 dígitos');
            setLoading(false);
            return;
        }
        
        if ((formData.domicilio || '').trim().length < 5) {
            setError('El domicilio debe tener al menos 5 caracteres');
            setLoading(false);
            return;
        }

        const dataToSend = {
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            contrasena: formData.password,
            telefono: formData.telefono,
            domicilio: formData.domicilio
        };

        try {
            const result = await register(dataToSend);
            
            if (result.success) {
                navigation.replace('Login');
            } else {
                setError(
                    primerErrorValidacion(result) ||
                    result.error ||
                    result.message ||
                    'Error al registrarse'
                );
            }
        } catch (error) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Registrate para alquilar o publicar propiedades</Text>

                {error ? (
                    <View style={styles.alertError}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Grid Name / Lastname convertido a Flexbox */}
                <View style={styles.row}>
                    <View style={styles.inputGroupHalf}>
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tu nombre"
                            value={formData.nombre}
                            onChangeText={(text) => handleChange('nombre', text)}
                        />
                    </View>

                    <View style={styles.inputGroupHalf}>
                        <Text style={styles.label}>Apellido</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tu apellido"
                            value={formData.apellido}
                            onChangeText={(text) => handleChange('apellido', text)}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ejemplo@correo.com"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                        secureTextEntry // Equivale a type="password"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Repetí tu contraseña"
                        value={formData.password_confirm}
                        onChangeText={(text) => handleChange('password_confirm', text)}
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 341 1234567"
                        value={formData.telefono}
                        onChangeText={(text) => handleChange('telefono', text)}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Domicilio</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Av. San Martín 123"
                        value={formData.domicilio}
                        onChangeText={(text) => handleChange('domicilio', text)}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Crear cuenta</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Iniciá sesión</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

