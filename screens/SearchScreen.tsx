import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Image, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import type { Torneo } from './TorneosScreen';
import Svg, { Circle, Path, Ellipse, Line, Polygon } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

function GolfBallIcon({ color, size = 16 }: { color: string; size?: number }) {
  const d = [
    "M 11,9.5 a 1.1,0.7 0 0,1 2.2,0", "M 14,9.5 a 1.1,0.7 0 0,1 2.2,0",
    "M 17,10 a 1.1,0.7 0 0,1 2.2,0", "M 9,12.5 a 1.1,0.7 0 0,1 2.2,0",
    "M 12,12.5 a 1.1,0.7 0 0,1 2.2,0", "M 15,12.5 a 1.1,0.7 0 0,1 2.2,0",
    "M 18,13 a 1.1,0.7 0 0,1 2.2,0", "M 8,15.5 a 1.1,0.7 0 0,1 2.2,0",
    "M 11,15.5 a 1.1,0.7 0 0,1 2.2,0", "M 14,15.5 a 1.1,0.7 0 0,1 2.2,0",
    "M 17,16 a 1.1,0.7 0 0,1 2.2,0", "M 8,18.5 a 1.1,0.7 0 0,1 2.2,0",
    "M 11,18.5 a 1.1,0.7 0 0,1 2.2,0", "M 14,18.5 a 1.1,0.7 0 0,1 2.2,0",
  ].join(" ");
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" fill="none" />
      <Path d={d} stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function GolfFlagIcon({ color, size = 17 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 2 24 24">
      <Ellipse cx="12" cy="20" rx="7" ry="2.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Polygon points="12,4 21,8 12,12" fill={color} />
    </Svg>
  );
}

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const GROUP_TAB_BAR_H = 44;
const BOTTOM_TAB_H = 80;

const MY_GROUPS = [
  { id: '1', name: 'Haras Santa María', type: 'club', members: 142, initials: 'HS', bg: '#1a2a0a', color: '#c8e03a', lastActivity: 'hace 2 horas' },
  { id: '2', name: 'Los del Jueves', type: 'privado', members: 6, initials: 'LJ', bg: '#2a1a3a', color: '#b070e0', lastActivity: 'hace 1 día' },
  { id: '3', name: 'Martindale CC', type: 'club', members: 89, initials: 'MC', bg: '#1a2a3a', color: '#5fa0e0', lastActivity: 'hace 3 días' },
];

const ALL_GROUPS = [
  ...MY_GROUPS,
  { id: '4', name: 'San Andrés GC', type: 'club', members: 67, initials: 'SA', bg: '#2a1a1a', color: '#e07070', lastActivity: 'hace 1 semana' },
  { id: '5', name: 'Olivos GC', type: 'club', members: 201, initials: 'OG', bg: '#1a1a2a', color: '#7070e0', lastActivity: 'hace 2 días' },
  { id: '6', name: 'Los Birdies', type: 'privado', members: 4, initials: 'LB', bg: '#2a2a1a', color: '#e0c03a', lastActivity: 'hace 5 días' },
];

const PLAYERS = [
  { name: 'Pepe Noceti', username: '@peponoceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3 },
  { name: 'Carlitos Laprida', username: '@carlitoslaprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', hcp: 15.1 },
  { name: 'Manu Rivero', username: '@manurivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', hcp: 9.8 },
  { name: 'Sofía Lagos', username: '@sofilagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', hcp: 18.4 },
  { name: 'Tomás Bidegain', username: '@tomibide', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', hcp: 11.2 },
];

type Group = typeof MY_GROUPS[0];
type Player = typeof PLAYERS[0];

type PostType = 'texto' | 'fotos' | 'sistema';

interface Post {
  id: string;
  tipo: PostType;
  autor?: string;
  initials?: string;
  bg?: string;
  color?: string;
  tiempo: string;
  texto?: string;
  fotos?: string[];
  precio?: string;
  eventoFecha?: string;
  eventoHora?: string;
  asistentes?: number;
  voy?: boolean;
  likes: number;
  liked: boolean;
  comentarios: number;
  pinned?: boolean;
}

const ACTIVIDAD_POSTS: Post[] = [
  {
    id: '0', tipo: 'texto', pinned: true,
    autor: 'Haras Santa María', initials: 'HS', bg: '#1a2a0a', color: '#c8e03a',
    tiempo: 'hace 1 día',
    texto: 'Recordatorio: el torneo del club es el 12 de julio. Inscripción cierra el viernes, hablar con la proshop para confirmar.',
    likes: 18, liked: false, comentarios: 3,
  },
  {
    id: '1', tipo: 'fotos',
    autor: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a',
    tiempo: 'hace 3 horas',
    texto: 'Día perfecto en Haras. El hoyo 7 nos mató a todos 😂',
    fotos: [
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
    ],
    likes: 12, liked: true, comentarios: 4,
  },
  {
    id: '2', tipo: 'texto',
    autor: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a',
    tiempo: 'hace 6 horas',
    texto: 'Alguien para el jueves? Yo estoy confirmado a las 8.',
    likes: 4, liked: false, comentarios: 5,
  },
  {
    id: '3', tipo: 'fotos',
    autor: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a',
    tiempo: 'hace 1 día',
    texto: 'Primera vez que bajo de 80 en Haras 🙌',
    fotos: ['https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800'],
    likes: 21, liked: false, comentarios: 7,
  },
  {
    id: '4', tipo: 'texto',
    autor: 'Sofía Lagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0',
    tiempo: 'hace 3 días',
    texto: 'Alguien tiene recomendación de profesor para trabajo de corto? Quiero mejorar el pitching antes del torneo.',
    likes: 6, liked: false, comentarios: 8,
  },
  {
    id: '5', tipo: 'sistema',
    tiempo: 'hace 5 días',
    texto: '🏆 Pepe Noceti ganó la Copa Junio con 38 puntos Stableford',
    likes: 0, liked: false, comentarios: 0,
  },
];

const TORNEOS_MOCK: Torneo[] = [
  {
    id: '1', nombre: 'Copa Junio', modalidad: 'Stableford', fecha: 'Jun 2026', estado: 'finalizado', grupo: 'Haras Santa María',
    participantes: [],
    leaderboard: [
      { pos: 1, nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', score: 38, diff: 0 },
      { pos: 2, nombre: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', score: 35, diff: 0 },
      { pos: 3, nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', score: 32, diff: 0 },
    ],
  },
  {
    id: '2', nombre: 'Torneo del Club', modalidad: 'Stroke Play', fecha: 'Jul 2026', estado: 'próximo', grupo: 'Haras Santa María',
    participantes: [
      { nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3 },
      { nombre: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', hcp: 15.1 },
      { nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', hcp: 9.8 },
    ],
  },
];

function Avatar({ initials, bg, color, size = 42 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────

const MOCK_COMMENTS = [
  { id: '1', autor: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', texto: 'Joya! Me apunto', tiempo: 'hace 1 h' },
  { id: '2', autor: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', texto: 'Yo también voy', tiempo: 'hace 45 min' },
  { id: '3', autor: 'Sofía Lagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', texto: 'No puedo esta semana 😢', tiempo: 'hace 20 min' },
];

function CommentsSheet({ visible, onClose, count }: { visible: boolean; onClose: () => void; count: number }) {
  const navigation = useNavigation<any>();
  const [text, setText] = useState('');
  const abrirPerfil = (c: typeof MOCK_COMMENTS[0]) =>
    navigation.navigate('PerfilUsuario', { viewUser: { name: c.autor, initials: c.initials, bg: c.bg, color: c.color } });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.commentsSheet}>
        <View style={styles.commentsHandle} />
        <Text style={styles.commentsTitle}>{count} comentarios</Text>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {MOCK_COMMENTS.map(c => (
            <View key={c.id} style={styles.commentRow}>
              <TouchableOpacity onPress={() => abrirPerfil(c)}>
                <Avatar initials={c.initials} bg={c.bg} color={c.color} size={32} />
              </TouchableOpacity>
              <View style={styles.commentBubble}>
                <View style={styles.commentMeta}>
                  <TouchableOpacity onPress={() => abrirPerfil(c)}>
                    <Text style={styles.commentAutor}>{c.autor}</Text>
                  </TouchableOpacity>
                  <Text style={styles.commentTiempo}>{c.tiempo}</Text>
                </View>
                <Text style={styles.commentTexto}>{c.texto}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.commentInput}>
          <Avatar initials="JU" bg="#2a1a3a" color="#b070e0" size={32} />
          <TextInput
            style={styles.commentTextInput}
            placeholder="Comentar..."
            placeholderTextColor={COLORS.dim}
            value={text}
            onChangeText={setText}
          />
          {text.length > 0 && (
            <TouchableOpacity onPress={() => setText('')}>
              <Ionicons name="send" size={18} color={COLORS.lime} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Post Cards ───────────────────────────────────────────────────────────────

function PostActions({ post, onLike, onComment }: { post: Post; onLike: () => void; onComment: () => void }) {
  return (
    <View style={styles.postActions}>
      <TouchableOpacity style={styles.postAction} onPress={onLike}>
        <GolfFlagIcon color={post.liked ? COLORS.lime : COLORS.dim} size={17} />
        {post.likes > 0 && <Text style={[styles.postActionText, post.liked && { color: COLORS.lime }]}>{post.likes}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.postAction} onPress={onComment}>
        <GolfBallIcon color={COLORS.dim} size={16} />
        {post.comentarios > 0 && <Text style={styles.postActionText}>{post.comentarios}</Text>}
      </TouchableOpacity>
    </View>
  );
}

function PostHeader({ post }: { post: Post }) {
  const navigation = useNavigation<any>();
  // El post fijado lo publica el club (la cuenta del grupo), no una persona — no navega a un perfil.
  const esPersona = !post.pinned;
  const abrirPerfil = () => navigation.navigate('PerfilUsuario', { viewUser: { name: post.autor, initials: post.initials, bg: post.bg, color: post.color } });
  return (
    <TouchableOpacity style={styles.postHeader} activeOpacity={esPersona ? 0.7 : 1} onPress={esPersona ? abrirPerfil : undefined}>
      <Avatar initials={post.initials!} bg={post.bg!} color={post.color!} size={36} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.postAutor}>{post.autor}</Text>
          {post.pinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={10} color={COLORS.lime} />
              <Text style={styles.pinnedText}>Fijado</Text>
            </View>
          )}
        </View>
        <Text style={styles.postTiempo}>{post.tiempo}</Text>
      </View>
    </TouchableOpacity>
  );
}

function TextPost({ post, onLike, onComment }: { post: Post; onLike: () => void; onComment: () => void }) {
  return (
    <View style={[styles.postCard, post.pinned && styles.postCardPinned]}>
      <PostHeader post={post} />
      <Text style={styles.postTexto}>{post.texto}</Text>
      <PostActions post={post} onLike={onLike} onComment={onComment} />
    </View>
  );
}

function FotosPost({ post, onLike, onComment }: { post: Post; onLike: () => void; onComment: () => void }) {
  const [page, setPage] = useState(0);
  const fotos = post.fotos || [];
  return (
    <View style={styles.postCard}>
      <PostHeader post={post} />
      {post.texto ? <Text style={[styles.postTexto, { marginBottom: 10 }]}>{post.texto}</Text> : null}
      <View style={{ borderRadius: 12, overflow: 'hidden', marginHorizontal: -16 }}>
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
        >
          {fotos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={{ width: SCREEN_W, height: SCREEN_W * 0.65 }} resizeMode="cover" />
          ))}
        </ScrollView>
        {fotos.length > 1 && (
          <View style={styles.photoDots}>
            {fotos.map((_, i) => <View key={i} style={[styles.photoDot, i === page && styles.photoDotActive]} />)}
          </View>
        )}
      </View>
      <PostActions post={post} onLike={onLike} onComment={onComment} />
    </View>
  );
}

function RondaPost({ post, onLike, onComment }: { post: Post; onLike: () => void; onComment: () => void }) {
  return (
    <View style={styles.postCard}>
      <PostHeader post={post} />
      {post.texto ? <Text style={[styles.postTexto, { marginBottom: 10 }]}>{post.texto}</Text> : null}
      <View style={styles.rondaCard}>
        <View style={styles.rondaRow}>
          <Text style={styles.rondaScore}>79</Text>
          <View>
            <Text style={styles.rondaCourse}>Haras Santa María</Text>
            <Text style={styles.rondaMeta}>-1 vs par · 28 Jun</Text>
          </View>
          <TouchableOpacity style={styles.verTarjetaBtn}>
            <Text style={styles.verTarjetaText}>Ver tarjeta</Text>
          </TouchableOpacity>
        </View>
      </View>
      <PostActions post={post} onLike={onLike} onComment={onComment} />
    </View>
  );
}

function VentaPost({ post, onLike, onComment }: { post: Post; onLike: () => void; onComment: () => void }) {
  const fotos = post.fotos || [];
  return (
    <View style={styles.postCard}>
      <PostHeader post={post} />
      <View style={styles.ventaContent}>
        {fotos.length > 0 && (
          <Image source={{ uri: fotos[0] }} style={styles.ventaImg} resizeMode="cover" />
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.ventaBadge}>
            <Text style={styles.ventaBadgeText}>En venta</Text>
          </View>
          <Text style={styles.postTexto}>{post.texto}</Text>
          <Text style={styles.ventaPrecio}>{post.precio}</Text>
          <TouchableOpacity style={styles.contactarBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#0f0f0f" />
            <Text style={styles.contactarText}>Contactar</Text>
          </TouchableOpacity>
        </View>
      </View>
      <PostActions post={post} onLike={onLike} onComment={onComment} />
    </View>
  );
}

function EventoPost({ post, onLike, onComment, onVoy }: { post: Post; onLike: () => void; onComment: () => void; onVoy: () => void }) {
  return (
    <View style={styles.postCard}>
      <PostHeader post={post} />
      {post.texto ? <Text style={[styles.postTexto, { marginBottom: 10 }]}>{post.texto}</Text> : null}
      <View style={styles.eventoCard}>
        <View style={styles.eventoInfo}>
          <View style={styles.eventoFechaBlock}>
            <Text style={styles.eventoFecha}>{post.eventoFecha}</Text>
            <Text style={styles.eventoHora}>{post.eventoHora}</Text>
          </View>
          <View style={styles.eventoSep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.eventoAsistentes}>{post.asistentes} van a ir</Text>
            <Text style={styles.eventoAsistentesSub}>Pepe, Carlitos y otro más</Text>
          </View>
          <TouchableOpacity
            style={[styles.voyBtn, post.voy && styles.voyBtnActive]}
            onPress={onVoy}
          >
            <Text style={[styles.voyBtnText, post.voy && styles.voyBtnTextActive]}>
              {post.voy ? '✓ Voy' : 'Voy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <PostActions post={post} onLike={onLike} onComment={onComment} />
    </View>
  );
}

function SistemaPost({ post }: { post: Post }) {
  return (
    <View style={styles.sistemaPost}>
      <Text style={styles.sistemaTexto}>{post.texto}</Text>
      <Text style={styles.sistemaTiempo}>{post.tiempo}</Text>
    </View>
  );
}

// ─── Post Composer ────────────────────────────────────────────────────────────

function PostComposer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const canPost = text.trim().length > 0 || photos.length > 0;

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos(p => [...p, ...result.assets.map(a => a.uri)].slice(0, 4));
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setPhotos(p => [...p, result.assets[0].uri].slice(0, 4));
  };

  const handleClose = () => { setText(''); setPhotos([]); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.composerSheet}>
          <View style={styles.composerHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.composerCancel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.composerPostBtn, !canPost && { opacity: 0.4 }]}
              onPress={handleClose}
              disabled={!canPost}
            >
              <Text style={styles.composerPostBtnText}>Publicar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.composerBody}>
            <Avatar initials="JU" bg="#2a1a3a" color="#b070e0" size={38} />
            <TextInput
              style={styles.composerInput}
              placeholder="¿Qué pasó en la cancha?"
              placeholderTextColor={COLORS.dim}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />
          </View>

          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.composerPhotos} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.composerThumb}>
                  <Image source={{ uri }} style={styles.composerThumbImg} />
                  <TouchableOpacity style={styles.composerThumbRemove} onPress={() => setPhotos(p => p.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.composerFooter}>
            <TouchableOpacity onPress={pickFromCamera} style={styles.composerAction}>
              <Ionicons name="camera-outline" size={22} color={COLORS.lime} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickFromGallery} style={styles.composerAction} disabled={photos.length >= 4}>
              <Ionicons name="image-outline" size={22} color={photos.length >= 4 ? COLORS.dim : COLORS.lime} />
            </TouchableOpacity>
            {text.length > 0 && <Text style={styles.composerCount}>{text.length}/500</Text>}
          </View>
        </View>
      </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── GroupDetail ──────────────────────────────────────────────────────────────

function GroupDetail({ group, onBack }: { group: Group; onBack: () => void }) {
  const navigation = useNavigation<any>();
  const isMember = MY_GROUPS.some(g => g.id === group.id);
  const [joined, setJoined] = useState(isMember);
  const [tab, setTab] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState<Post[]>(ACTIVIDAD_POSTS);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);

  const pagerRef = useRef<PagerView>(null);
  const tabRef = useRef(0);

  const handleTabPress = (i: number) => {
    setTab(i); tabRef.current = i;
    pagerRef.current?.setPage(i);
  };

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      : p
    ));
  };

  const TABS = ['Actividad', 'Torneos', 'Participantes'];

  const renderPost = (post: Post) => {
    const onLike = () => toggleLike(post.id);
    const onComment = () => setCommentsPost(post);
    switch (post.tipo) {
      case 'fotos': return <FotosPost key={post.id} post={post} onLike={onLike} onComment={onComment} />;
      case 'sistema': return <SistemaPost key={post.id} post={post} />;
      default: return <TextPost key={post.id} post={post} onLike={onLike} onComment={onComment} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PostComposer visible={showComposer} onClose={() => setShowComposer(false)} />
      {commentsPost && (
        <CommentsSheet
          visible={!!commentsPost}
          onClose={() => setCommentsPost(null)}
          count={commentsPost.comentarios}
        />
      )}

      {/* Nav fija */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{group.name}</Text>
        {tab === 1 && (
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => navigation.navigate('CreateTorneo', { grupoFijo: group.name })}>
            <Ionicons name="add" size={24} color={COLORS.lime} />
          </TouchableOpacity>
        )}
      </View>

      {/* Líder fijo */}
      <TouchableOpacity
        style={styles.leaderCard}
        onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: 'Pepe Noceti', initials: 'PE', bg: '#222', color: COLORS.lime } })}
      >
        <View style={styles.leaderAccent} />
        <Avatar initials="PE" bg="#222" color={COLORS.lime} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.leaderLabel}>Mejor ronda del mes</Text>
          <Text style={styles.leaderName}>Pepe Noceti</Text>
        </View>
        <View style={styles.leaderScoreBlock}>
          <Text style={styles.leaderScoreNum}>71</Text>
          <Text style={styles.leaderScoreSub}>-1 vs par</Text>
        </View>
      </TouchableOpacity>

      {/* Tabs fijos */}
      <View style={styles.groupTabBar}>
        {TABS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[styles.groupTabBtn, tab === i && styles.groupTabBtnActive]}
            onPress={() => handleTabPress(i)}
          >
            <Text style={[styles.groupTabBtnText, tab === i && styles.groupTabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido scrolleable */}
      <View style={{ flex: 1 }}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={e => { setTab(e.nativeEvent.position); tabRef.current = e.nativeEvent.position; }}
        >
          <ScrollView key="0" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {posts.map(renderPost)}
          </ScrollView>

          <ScrollView key="1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {TORNEOS_MOCK.map(t => (
              <TouchableOpacity key={t.id} style={styles.torneoRow} onPress={() => navigation.navigate('TorneoDetail', { torneo: t })}>
                <View style={[styles.torneoEstadoDot, t.estado === 'próximo' ? styles.torneoEstadoDotNext : styles.torneoEstadoDotDone]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.torneoNombre}>{t.nombre}</Text>
                  <Text style={styles.torneoMeta}>{t.modalidad} · {t.fecha}</Text>
                </View>
                {t.estado === 'finalizado'
                  ? <Text style={styles.torneoGanadorInline}>🏆 {t.leaderboard?.[0]?.nombre}</Text>
                  : <View style={styles.torneoBadgeNext}><Text style={styles.torneoBadgeNextText}>Próximo</Text></View>
                }
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView key="2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {PLAYERS.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={styles.row}
                onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: p.name, initials: p.initials, bg: p.bg, color: p.color, handicap: p.hcp } })}
              >
                <Avatar initials={p.initials} bg={p.bg} color={p.color} size={46} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{p.name}</Text>
                  <Text style={styles.rowSub}>{p.username} · HCP {p.hcp}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </PagerView>

        {tab === 0 && (
          <TouchableOpacity style={styles.fab} onPress={() => setShowComposer(true)}>
            <Ionicons name="add" size={26} color="#0f0f0f" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Modales ──────────────────────────────────────────────────────────────────

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <View style={styles.modal}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo grupo</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Nombre del grupo</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.inputText}
            placeholder="Ej: Los del Jueves"
            placeholderTextColor={COLORS.dim}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
        <TouchableOpacity
          style={[styles.createBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={onClose}
          disabled={!name.trim()}
        >
          <Text style={styles.createBtnText}>Crear grupo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  const isMember = MY_GROUPS.some(g => g.id === group.id);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Avatar initials={group.initials} bg={group.bg} color={group.color} size={46} />
      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <Text style={styles.rowName}>{group.name}</Text>
          {isMember && <Ionicons name="checkmark-circle" size={15} color={COLORS.lime} />}
        </View>
        <Text style={styles.rowSub}>{group.members} miembros · {group.type === 'club' ? 'Club' : 'Privado'} · {group.lastActivity}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const navigation = useNavigation<any>();
  const [following, setFollowing] = useState(false);
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
        onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: player.name, initials: player.initials, bg: player.bg, color: player.color, handicap: player.hcp } })}
      >
        <Avatar initials={player.initials} bg={player.bg} color={player.color} size={46} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{player.name}</Text>
          <Text style={styles.rowSub}>{player.username} · HCP {player.hcp}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.followBtn, following && styles.followBtnActive]}
        onPress={() => setFollowing(!following)}
      >
        <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
          {following ? 'Siguiendo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const q = search.toLowerCase();
  const filteredGroups = ALL_GROUPS.filter(g => g.name.toLowerCase().includes(q));
  const filteredPlayers = PLAYERS.filter(p =>
    p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
  );
  const isSearching = search.length > 0;

  if (selectedGroup) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}

      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.dim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Grupos o jugadores..."
          placeholderTextColor={COLORS.dim}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.dim} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isSearching && filteredGroups.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Grupos</Text>
            <View style={styles.list}>
              {filteredGroups.map(g => (
                <GroupRow key={g.id} group={g} onPress={() => setSelectedGroup(g)} />
              ))}
            </View>
          </>
        )}

        {isSearching && filteredPlayers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Jugadores</Text>
            <View style={styles.list}>
              {filteredPlayers.map((p, i) => <PlayerRow key={i} player={p} />)}
            </View>
          </>
        )}

        {isSearching && filteredGroups.length === 0 && filteredPlayers.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
          </View>
        )}

        <TouchableOpacity style={styles.createGroupBtn} onPress={() => setShowCreate(true)}>
          <View style={styles.createGroupIcon}>
            <Ionicons name="add" size={20} color={COLORS.lime} />
          </View>
          <Text style={styles.createGroupBtnText}>Crear grupo</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Tus grupos</Text>
        <View style={styles.list}>
          {MY_GROUPS.map(g => (
            <GroupRow key={g.id} group={g} onPress={() => setSelectedGroup(g)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  createGroupBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  createGroupBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.lime },
  createGroupIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1a2a0a', alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#161616', borderRadius: 10, borderWidth: 0.5, borderColor: '#222',
    marginHorizontal: 18, paddingHorizontal: 12, marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.white },
  scroll: { paddingBottom: 24 },
  sectionTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  list: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  rowSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  followBtn: { borderWidth: 0.5, borderColor: COLORS.lime, backgroundColor: COLORS.lime, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  followBtnActive: { borderColor: '#333', backgroundColor: 'transparent' },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#0f0f0f' },
  followBtnTextActive: { color: COLORS.muted },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: COLORS.muted },

  // Detail
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  headerAddBtn: { padding: 2 },
  backBtn: { padding: 2 },
  detailTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white, flex: 1 },
  joinBtnSmall: { backgroundColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  joinBtnSmallActive: { backgroundColor: COLORS.dark2, borderWidth: 0.5, borderColor: COLORS.border },
  joinBtnSmallText: { fontSize: 12, fontWeight: '700', color: '#0f0f0f' },
  joinBtnSmallTextActive: { color: COLORS.muted },

  // Floating / sticky
  groupTabBar: { height: GROUP_TAB_BAR_H, flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e', backgroundColor: COLORS.bg },
  groupTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  groupTabBtnActive: { borderBottomColor: COLORS.lime },
  groupTabBtnText: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  groupTabBtnTextActive: { color: COLORS.white, fontWeight: '700' },
  leaderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 18, marginVertical: 10, backgroundColor: '#141414', borderRadius: 12, borderWidth: 0.5, borderColor: '#222', paddingVertical: 12, paddingRight: 14, overflow: 'hidden' },
  leaderAccent: { width: 3, height: '100%', backgroundColor: COLORS.lime, borderRadius: 2, marginLeft: -1 },
  leaderLabel: { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  leaderName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  leaderScoreBlock: { alignItems: 'flex-end' },
  leaderScoreNum: { fontSize: 20, fontWeight: '900', color: COLORS.lime },
  leaderScoreSub: { fontSize: 10, color: COLORS.muted, marginTop: 1 },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 18, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center', zIndex: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

  // Post cards
  postCard: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 8, borderBottomColor: '#1a1a1a' },
  postCardPinned: { backgroundColor: '#0f1a09' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAutor: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  postTiempo: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
  postTexto: { fontSize: 14, color: '#ddd', lineHeight: 20 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#1a2a0a', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  pinnedText: { fontSize: 10, color: COLORS.lime, fontWeight: '700' },
  postActions: { flexDirection: 'row', gap: 20, marginTop: 12 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postActionText: { fontSize: 13, color: COLORS.muted },

  // Fotos
  photoDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: 8, backgroundColor: '#000' },
  photoDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#444' },
  photoDotActive: { backgroundColor: COLORS.lime, width: 14 },

  // Ronda
  rondaCard: { backgroundColor: '#161616', borderRadius: 12, borderWidth: 0.5, borderColor: '#222', padding: 12 },
  rondaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rondaScore: { fontSize: 28, fontWeight: '900', color: COLORS.white, width: 50 },
  rondaCourse: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  rondaMeta: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  verTarjetaBtn: { marginLeft: 'auto', borderWidth: 0.5, borderColor: '#444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  verTarjetaText: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },

  // Venta
  ventaContent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ventaImg: { width: 80, height: 80, borderRadius: 10 },
  ventaBadge: { backgroundColor: '#2a1a0a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  ventaBadgeText: { fontSize: 10, color: '#e0903a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  ventaPrecio: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  contactarBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 4 },
  contactarText: { fontSize: 12, fontWeight: '700', color: '#0f0f0f' },

  // Evento
  eventoCard: { backgroundColor: '#161616', borderRadius: 12, borderWidth: 0.5, borderColor: '#222', padding: 12 },
  eventoInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventoFechaBlock: { alignItems: 'center', minWidth: 48 },
  eventoFecha: { fontSize: 12, fontWeight: '700', color: COLORS.lime },
  eventoHora: { fontSize: 16, fontWeight: '900', color: COLORS.white },
  eventoSep: { width: 0.5, height: 36, backgroundColor: '#333' },
  eventoAsistentes: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  eventoAsistentesSub: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  voyBtn: { marginLeft: 'auto', borderWidth: 0.5, borderColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  voyBtnActive: { backgroundColor: COLORS.lime },
  voyBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.lime },
  voyBtnTextActive: { color: '#0f0f0f' },

  // Sistema
  sistemaPost: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 8, borderBottomColor: '#1a1a1a' },
  sistemaTexto: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  sistemaTiempo: { fontSize: 11, color: COLORS.dim, textAlign: 'center', marginTop: 3 },

  // Composer
  composerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  composerSheet: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  composerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  composerCancel: { fontSize: 15, color: COLORS.muted },
  composerPostBtn: { backgroundColor: COLORS.lime, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  composerPostBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
  composerBody: { flexDirection: 'row', gap: 12, padding: 16, minHeight: 120 },
  composerInput: { flex: 1, fontSize: 16, color: COLORS.white, lineHeight: 22 },
  composerPhotos: { marginBottom: 8 },
  composerThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden' },
  composerThumbImg: { width: 80, height: 80 },
  composerThumbRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#1e1e1e' },
  composerAction: { padding: 8 },
  composerCount: { marginLeft: 'auto', fontSize: 12, color: COLORS.dim },

  // Comments
  commentsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  commentsSheet: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: SCREEN_H * 0.65, paddingTop: 12 },
  commentsHandle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  commentsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, paddingHorizontal: 20, marginBottom: 12 },
  commentRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#1e1e1e' },
  commentBubble: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 12, padding: 10 },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAutor: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  commentTiempo: { fontSize: 11, color: COLORS.dim },
  commentTexto: { fontSize: 13, color: '#ddd', lineHeight: 18 },
  commentInput: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#1e1e1e' },
  commentTextInput: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: COLORS.white },

  // Torneos
  torneoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  torneoEstadoDot: { width: 8, height: 8, borderRadius: 4 },
  torneoEstadoDotNext: { backgroundColor: COLORS.lime },
  torneoEstadoDotDone: { backgroundColor: COLORS.dim },
  torneoNombre: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  torneoMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  torneoGanadorInline: { fontSize: 12, color: COLORS.muted },
  torneoBadgeNext: { backgroundColor: '#1a2a0a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  torneoBadgeNextText: { fontSize: 11, fontWeight: '700', color: COLORS.lime },

  // Modales
  modal: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 },
  modalCard: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%', paddingTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 4 },
  modalFooter: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#222' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  createBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
  inputBox: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2a', paddingHorizontal: 14 },
  inputText: { fontSize: 14, color: COLORS.white, paddingVertical: 12 },
  dropdown: { borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2a', overflow: 'hidden' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#1a1a1a' },
  dropdownBtnText: { fontSize: 14, color: COLORS.white, fontWeight: '500' },
  visibilidadBtn: { borderWidth: 0.5, borderColor: '#2a2a2a', borderRadius: 10, padding: 14, backgroundColor: '#1a1a1a' },
  visibilidadBtnActive: { borderColor: COLORS.lime, backgroundColor: '#1a2a0a' },
  visibilidadBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  visibilidadBtnTextActive: { color: COLORS.lime },
  visibilidadGrupoNombre: { fontSize: 11, color: COLORS.dim, marginTop: 3 },
});
