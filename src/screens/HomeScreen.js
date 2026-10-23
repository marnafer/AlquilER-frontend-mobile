import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import PropertyCard from '../components/PropertyCard';
import PublicarPropiedadSection from '../components/PublicarPropiedadSection';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { obtenerCantidadNotificacionesNoLeidas } from '../services/notificationService';
import { abrirPropiedad } from '../services/propertyNavigation';
import { obtenerPropiedadesVistas } from '../services/recentProperties';
import { theme } from '../theme/theme';

const colorConOpacidad = (color, opacidad) => {
    if (!color) return 'rgba(0, 0, 0, 0)';
    const hex = color.replace('#', '');
    if (hex.length !== 6) return color;
    const rojo = parseInt(hex.substring(0, 2), 16);
    const verde = parseInt(hex.substring(2, 4), 16);
    const azul = parseInt(hex.substring(4, 6), 16);
    return `rgba(${rojo}, ${verde}, ${azul}, ${opacidad})`;
};

const limitar = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo);

const crearValoresResponsive = (width, height) => {
    const escala = limitar(width / 375, 0.88, 1.2);
    const separacionSeccion = limitar(height * 0.025, 16, 28);
    const separacionPequena = limitar(6 * escala, 5, 8);
    const separacionMedia = limitar(12 * escala, 10, 16);
    const separacionGrande = limitar(18 * escala, 14, 24);
    const paddingHorizontal = limitar(width * 0.043, 16, 28);
    const paddingHero = limitar(width * 0.043, 16, 28);
    const radioPequeno = limitar(10 * escala, 8, 12);
    const radioMedio = limitar(16 * escala, 14, 20);
    const radioGrande = limitar(28 * escala, 24, 34);
    const fontBody = limitar(14 * escala, 13, 16);
    const fontSmall = limitar(12 * escala, 11, 14);
    const fontFilter = limitar(13 * escala, 12, 15);
    const fontSectionTitle = limitar(24 * escala, 21, 29);
    const fontHeroTitle = limitar(30 * escala, 26, 36);
    const fontHeroHighlight = limitar(32 * escala, 28, 38);
    const fontStatNumber = limitar(28 * escala, 24, 34);
    const iconCategory = limitar(30 * escala, 26, 36);
    const categorySize = limitar(68 * escala, 60, 78);
    const categoryWidth = limitar(100 * escala, 90, 120);
    const bottomContentSpace = limitar(height * 0.1, 120, 160);

    return {
        escala, separacionSeccion, separacionPequena, separacionMedia, separacionGrande,
        paddingHorizontal, paddingHero, radioPequeno, radioMedio, radioGrande, fontBody,
        fontSmall, fontFilter, fontSectionTitle, fontHeroTitle, fontHeroHighlight,
        fontStatNumber, iconCategory, categorySize, categoryWidth, bottomContentSpace,
    };
};

export default function HomeScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { width, height } = useWindowDimensions();
    const responsive = useMemo(() => crearValoresResponsive(width, height), [width, height]);
    const styles = useMemo(() => crearEstilos(responsive), [responsive]);

    const [propiedades, setPropiedades] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [categoriasBusqueda, setCategoriasBusqueda] = useState([]);
    const [localidadesBusqueda, setLocalidadesBusqueda] = useState([]);
    const [categoriasAbierto, setCategoriasAbierto] = useState(false);
    const [localidadesAbierto, setLocalidadesAbierto] = useState(false);
    const [propiedadesVistas, setPropiedadesVistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

    const cargarPropiedadesVistas = async () => {
        const idsVistos = await obtenerPropiedadesVistas();
        const vistas = idsVistos
            .map((id) => propiedades.find((propiedad) => Number(propiedad.id) === Number(id)))
            .filter(Boolean);
        setPropiedadesVistas(vistas);
    };

    const cargarDatos = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [propiedadesResponse, categoriasResponse, localidadesResponse] = await Promise.all([
                api.get('/propiedades', { params: { limit: 5 } }),
                api.get('/categorias'),
                api.get('/localidades'),
            ]);

            setCategorias(categoriasResponse.data?.data?.items || categoriasResponse.data?.data || categoriasResponse.data || []);
            setLocalidades(localidadesResponse.data?.data?.items || localidadesResponse.data?.data || localidadesResponse.data || []);
            setPropiedades(propiedadesResponse.data?.data?.items || []);
        } catch (error) {
            console.error('HOME: ERROR', error);
            setError('No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

    const cargarNotificacionesNoLeidas = async () => {
        try {
            if (!isAuthenticated) {
                setNotificacionesNoLeidas(0);
                return;
            }
            const response = await obtenerCantidadNotificacionesNoLeidas();
            if (!response?.success) {
                setNotificacionesNoLeidas(0);
                return;
            }
            setNotificacionesNoLeidas(Number(response.data?.no_leidas || 0));
        } catch (error) {
            console.error('HOME: error al cargar notificaciones', error);
            setNotificacionesNoLeidas(0);
        }
    };

    useFocusEffect(useCallback(() => {
        if (propiedades.length > 0) cargarPropiedadesVistas();
    }, [propiedades]));

    useFocusEffect(useCallback(() => { cargarNotificacionesNoLeidas(); }, [isAuthenticated]));

    const toggleCategoria = (id) => {
        const categoriaId = String(id);
        setCategoriasBusqueda((actuales) =>
            actuales.includes(categoriaId) ? actuales.filter((actualId) => actualId !== categoriaId) : [...actuales, categoriaId]
        );
    };

    const toggleLocalidad = (id) => {
        const localidadId = String(id);
        setLocalidadesBusqueda((actuales) =>
            actuales.includes(localidadId) ? actuales.filter((actualId) => actualId !== localidadId) : [...actuales, localidadId]
        );
    };

    const handlePropiedadVista = async (propiedad) => {
        await abrirPropiedad(router, propiedad);
        setPropiedadesVistas((actuales) => [
            propiedad,
            ...actuales.filter((actual) => actual.id !== propiedad.id),
        ]);
    };

    const handleBuscar = () => {
        const params = {};
        if (categoriasBusqueda.length > 0) params.categoria_id = categoriasBusqueda;
        if (localidadesBusqueda.length > 0) params.localidad_id = localidadesBusqueda;
        router.push({ pathname: '/properties', params });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* HERO */}
            <View style={styles.hero}>
                <View style={styles.heroHeader}>
                    <View style={styles.heroHeaderSide}>
                        <Image
                            source={require('../../assets/images/logo512.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit>
                        AlquilER
                    </Text>

                    <View style={styles.heroHeaderSide}>
                        {isAuthenticated && (
                            <TouchableOpacity
                                style={styles.notificationButton}
                                onPress={() => router.push('/notifications')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                                {notificacionesNoLeidas > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionTitle}>Alquilá con más confianza</Text>
                    <Text style={styles.descriptionText}>
                        Calificaciones y reseñas de la comunidad para una mayor transparencia.
                    </Text>
                </View>

                <View style={styles.searchBox}>
                    {/* LOCALIDAD */}
                    <TouchableOpacity
                        style={styles.dropdownHeader}
                        onPress={() => setLocalidadesAbierto((actual) => !actual)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.dropdownHeaderText}>
                            <Text style={styles.filterLabelDropdown}>Localidad</Text>
                            <Text style={styles.dropdownSummary}>
                                {localidadesBusqueda.length === 0 ? 'Todas' : `${localidadesBusqueda.length} seleccionadas`}
                            </Text>
                        </View>
                        <Ionicons 
                            name={localidadesAbierto ? 'chevron-up' : 'chevron-down'} 
                            size={18} 
                            color={theme.colors.textMuted} 
                        />
                    </TouchableOpacity>

                    {localidadesAbierto && (
                        <View style={styles.dropdownContent}>
                            <ScrollView style={styles.optionsDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                <View style={styles.optionsDropdownContainer}>
                                    <TouchableOpacity
                                        style={[styles.filterOption, localidadesBusqueda.length === 0 && styles.filterOptionSelected]}
                                        onPress={() => setLocalidadesBusqueda([])}
                                    >
                                        <Text style={[styles.filterOptionText, localidadesBusqueda.length === 0 && styles.filterOptionTextSelected]}>
                                            Todas
                                        </Text>
                                    </TouchableOpacity>
                                    {localidades.map((localidad) => {
                                        const seleccionada = localidadesBusqueda.includes(String(localidad.id));
                                        return (
                                            <TouchableOpacity
                                                key={localidad.id}
                                                style={[styles.filterOption, seleccionada && styles.filterOptionSelected]}
                                                onPress={() => toggleLocalidad(localidad.id)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.filterOptionText, seleccionada && styles.filterOptionTextSelected]}>
                                                    {localidad.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {/* TIPO */}
                    <TouchableOpacity
                        style={styles.dropdownHeader}
                        onPress={() => setCategoriasAbierto((actual) => !actual)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.dropdownHeaderText}>
                            <Text style={styles.filterLabelDropdown}>Tipo</Text>
                            <Text style={styles.dropdownSummary}>
                                {categoriasBusqueda.length === 0 ? 'Todos' : `${categoriasBusqueda.length} seleccionados`}
                            </Text>
                        </View>
                        <Ionicons 
                            name={categoriasAbierto ? 'chevron-up' : 'chevron-down'} 
                            size={18} 
                            color={theme.colors.textMuted} 
                        />
                    </TouchableOpacity>

                    {categoriasAbierto && (
                        <View style={styles.dropdownContent}>
                            <ScrollView style={styles.optionsDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                <View style={styles.optionsDropdownContainer}>
                                    <TouchableOpacity
                                        style={[styles.filterOption, categoriasBusqueda.length === 0 && styles.filterOptionSelected]}
                                        onPress={() => setCategoriasBusqueda([])}
                                    >
                                        <Text style={[styles.filterOptionText, categoriasBusqueda.length === 0 && styles.filterOptionTextSelected]}>
                                            Todos
                                        </Text>
                                    </TouchableOpacity>
                                    {categorias.map((categoria) => {
                                        const seleccionada = categoriasBusqueda.includes(String(categoria.id));
                                        return (
                                            <TouchableOpacity
                                                key={categoria.id}
                                                style={[styles.filterOption, seleccionada && styles.filterOptionSelected]}
                                                onPress={() => toggleCategoria(categoria.id)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.filterOptionText, seleccionada && styles.filterOptionTextSelected]}>
                                                    {categoria.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    <TouchableOpacity style={styles.searchButton} onPress={handleBuscar} activeOpacity={0.8}>
                        <Ionicons name="search-outline" size={18} color="#ffffff" />
                        <Text style={styles.searchButtonText}>Buscar propiedades</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* VISTOS RECIENTEMENTE */}
            {propiedadesVistas.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionBadge}>Tu actividad</Text>
                        <Text style={styles.sectionTitle}>Vistos recientemente</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertiesScroll}>
                        {propiedadesVistas.slice(0, 5).map((propiedad) => (
                            <PropertyCard
                                key={propiedad.id}
                                propiedad={propiedad}
                                compacto
                                onPress={() => handlePropiedadVista(propiedad)}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* PROPIEDADES RECIENTES */}
            <View style={[styles.section, styles.sectionHighlight, { backgroundColor: colorConOpacidad(theme.colors.primary, 0.06) }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionBadge}>Catálogo</Text>
                    <Text style={styles.sectionTitle}>Nuevas propiedades</Text>
                    <Text style={styles.sectionDescription}>Las últimas publicaciones en AlquilER</Text>
                </View>

                {propiedades.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertiesScroll}>
                        {propiedades.map((propiedad) => (
                            <PropertyCard
                                key={propiedad.id}
                                propiedad={propiedad}
                                compacto
                                onPress={() => handlePropiedadVista(propiedad)}
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={styles.emptyText}>No hay propiedades publicadas.</Text>
                )}
            </View>

            <PublicarPropiedadSection />
        </ScrollView>
    );
}

const crearEstilos = (responsive) => {
    const {
        separacionSeccion, separacionPequena, separacionMedia, separacionGrande, paddingHorizontal, paddingHero,
        radioPequeno, radioMedio, radioGrande, fontBody, fontSmall, fontFilter, fontSectionTitle,
        fontHeroTitle, fontHeroHighlight, fontStatNumber, iconCategory, categorySize, categoryWidth, bottomContentSpace,
    } = responsive;

    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        content: { paddingBottom: bottomContentSpace },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, paddingHorizontal },
        loadingText: { marginTop: separacionMedia, color: theme.colors.text, fontSize: fontBody, fontWeight: '500' },
        
        hero: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: paddingHero,
            paddingTop: separacionPequena,
            paddingBottom: separacionGrande, 
            borderBottomLeftRadius: radioGrande,
            borderBottomRightRadius: radioGrande,
            alignItems: 'center'
        },
        heroTitle: { flex: 1, color: '#ffffff', fontSize: fontHeroTitle, fontWeight: '800', textAlign: 'center', paddingHorizontal: 4 },
        heroHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: separacionPequena },
        heroHeaderSide: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
        
        notificationButton: {
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: colorConOpacidad('#FFFFFF', 0.15),
            borderWidth: 1, borderColor: colorConOpacidad('#FFFFFF', 0.25),
            justifyContent: 'center', alignItems: 'center',
        },
        notificationBadge: {
            position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20,
            paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#ef4444',
            borderWidth: 2, borderColor: theme.colors.primary,
            justifyContent: 'center', alignItems: 'center',
        },
        notificationBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
        
        descriptionCard: {
            width: '90%', maxWidth: 560, alignSelf: 'center', marginBottom: separacionMedia,
            paddingHorizontal: separacionGrande, paddingVertical: separacionMedia,
            borderRadius: radioMedio, backgroundColor: colorConOpacidad('#FFFFFF', 0.12),
            borderWidth: 1, borderColor: colorConOpacidad('#FFFFFF', 0.22),
        },
        descriptionTitle: { color: '#FFFFFF', fontSize: fontBody + 2, fontWeight: '700', textAlign: 'center', marginBottom: separacionPequena },
        descriptionText: { color: '#FFFFFF', opacity: 0.95, fontSize: fontSmall, lineHeight: fontSmall + 6, textAlign: 'center' },
        
        searchBox: {
            backgroundColor: '#ffffff',
            borderRadius: radioMedio,
            paddingHorizontal: separacionGrande,
            paddingVertical: separacionMedia,
            width: '90%', maxWidth: 560, alignSelf: 'center',
            // Efecto de flotación sobre el Hero
            marginTop: -30,
            marginBottom: 20,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
        },
        searchTitle: { fontSize: fontBody + 4, fontWeight: '700', color: theme.colors.textDark, textAlign: 'center', marginBottom: separacionMedia },
        filterLabel: { fontSize: fontBody, fontWeight: '600', color: theme.colors.textDark, marginBottom: separacionPequena },
        filterScroll: { marginBottom: separacionMedia },
        
        filterOption: {
            paddingHorizontal: separacionMedia, paddingVertical: separacionPequena,
            borderRadius: 8, backgroundColor: theme.colors.background,
            borderWidth: 1, borderColor: theme.colors.border,
        },
        filterOptionSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
        filterOptionText: { color: theme.colors.textDark, fontSize: fontFilter, fontWeight: '500' },
        filterOptionTextSelected: { color: '#ffffff', fontWeight: '700' },
        
        searchButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: separacionGrande,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            elevation: 3,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
        },
        searchButtonText: { color: '#ffffff', fontSize: fontBody + 1, fontWeight: '700', textAlign: 'center' },
        
        errorBox: { marginHorizontal: paddingHorizontal, marginTop: separacionSeccion, padding: separacionMedia, borderRadius: radioPequeno, backgroundColor: theme.colors.errorBg },
        errorText: { color: theme.colors.errorText, textAlign: 'center', fontSize: fontBody, fontWeight: '500' },
        
        section: { marginTop: separacionSeccion },
        sectionHighlight: { paddingVertical: separacionGrande },
        sectionHeader: { paddingHorizontal, marginBottom: separacionMedia },
        sectionBadge: { color: theme.colors.primary, fontSize: fontSmall, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
        sectionTitle: { color: theme.colors.textDark, fontSize: fontSectionTitle, fontWeight: '800', marginBottom: 4 },
        sectionDescription: { color: theme.colors.textMuted, fontSize: fontBody, lineHeight: fontBody + 6 },
        
        propertiesScroll: { paddingHorizontal, gap: separacionMedia },
        emptyText: { color: theme.colors.textMuted, textAlign: 'center', paddingHorizontal, paddingVertical: separacionGrande, fontSize: fontBody, fontWeight: '500' },
        
        dropdownHeader: {
            minHeight: 56, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 10,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.inputBg,
        },
        dropdownHeaderText: { flex: 1 },
        filterLabelDropdown: { fontSize: 14, fontWeight: '700', color: theme.colors.textDark },
        dropdownSummary: { marginTop: 2, fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
        
        dropdownContent: {
            marginBottom: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border,
            borderRadius: 12, backgroundColor: theme.colors.inputBg,
        },
        optionsDropdownScroll: { maxHeight: 180 },
        optionsDropdownContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        logo: { width: 64, height: 64 },
    });
};