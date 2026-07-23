import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Image, Modal, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { estadoDeTorneo } from '../services/tournaments';
import Svg, { Circle, Path, Ellipse, Line, Polygon } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, addDoc, updateDoc, serverTimestamp, getDocs, limit, increment } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { joinGroup } from '../services/groups';
import type { CommentDoc, GroupDoc, GroupMemberDoc, GroupPostDoc, TournamentDoc, UserDoc } from '../firebase/types';
import { formatFechaTorneo } from './TorneosScreen';

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

// Paleta para avatares de grupos: el color se elige de forma estable a partir del id.
const GROUP_PALETTE = [
  { bg: '#1a2a0a', color: '#c8e03a' },
  { bg: '#2a1a3a', color: '#b070e0' },
  { bg: '#1a2a3a', color: '#5fa0e0' },
  { bg: '#2a1a1a', color: '#e07070' },
  { bg: '#2a2a1a', color: '#e0c03a' },
];

function groupVisual(g: GroupDoc) {
  const initials = g.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const hash = g.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { initials, ...GROUP_PALETTE[hash % GROUP_PALETTE.length] };
}

function formatTs(ts: any): string {
  if (!ts?.toDate) return 'ahora';
  const mins = (Date.now() - ts.toDate().getTime()) / 60000;
  if (mins < 60) return `hace ${Math.max(1, Math.round(mins))} min`;
  if (mins < 60 * 24) return `hace ${Math.round(mins / 60)} h`;
  if (mins < 60 * 24 * 7) return `hace ${Math.round(mins / (60 * 24))} d`;
  return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

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


function Avatar({ initials, bg, color, size = 42 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────

function CommentsSheet({ visible, onClose, count, groupId, postId }: { visible: boolean; onClose: () => void; count: number; groupId: string; postId: string }) {
  const navigation = useNavigation<any>();
  const { firebaseUser, userDoc } = useAuth();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [kbHeight, setKbHeight] = useState(0);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [sending, setSending] = useState(false);

  const myInitials = (userDoc?.displayName ?? '??').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, e => setKbHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const q = query(collection(db, 'groups', groupId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setComments(snap.docs.map(d => ({ ...d.data(), id: d.id }) as CommentDoc)));
  }, [visible, groupId, postId]);

  const abrirPerfil = (c: CommentDoc) =>
    navigation.navigate('PerfilUsuario', { viewUser: { name: c.authorName, initials: c.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } });

  const enviar = async () => {
    const value = text.trim();
    if (!value || !firebaseUser || sending) return;
    setSending(true);
    setText('');
    try {
      const authorName = userDoc?.displayName ?? 'Vos';
      const authorInitials = authorName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
      await addDoc(collection(db, 'groups', groupId, 'posts', postId, 'comments'), {
        authorId: firebaseUser.uid,
        authorName,
        authorInitials,
        authorAvatarColor: '#0f0f0f',
        text: value,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'groups', groupId, 'posts', postId), { commentsCount: increment(1) });
    } catch {
      setText(value);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      <View style={styles.commentsSheet}>
        <View style={styles.commentsHandle} />
        <Text style={styles.commentsTitle}>{count} {count === 1 ? 'comentario' : 'comentarios'}</Text>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {comments.length > 0 ? comments.map(c => (
            <View key={c.id} style={styles.commentRow}>
              <TouchableOpacity onPress={() => abrirPerfil(c)}>
                <Avatar initials={c.authorInitials} bg={COLORS.lime} color="#0f0f0f" size={32} />
              </TouchableOpacity>
              <View style={styles.commentBubble}>
                <View style={styles.commentMeta}>
                  <TouchableOpacity onPress={() => abrirPerfil(c)}>
                    <Text style={styles.commentAutor}>{c.authorName}</Text>
                  </TouchableOpacity>
                  <Text style={styles.commentTiempo}>{formatTs(c.createdAt)}</Text>
                </View>
                <Text style={styles.commentTexto}>{c.text}</Text>
              </View>
            </View>
          )) : <Text style={styles.commentsEmpty}>Sin comentarios todavía. ¡Sé el primero!</Text>}
        </ScrollView>
        <View style={[styles.commentInput, { paddingBottom: kbHeight > 0 ? kbHeight + 12 : 12 + insets.bottom }]}>
          <Avatar initials={myInitials} bg={COLORS.lime} color="#0f0f0f" size={32} />
          <TextInput
            style={styles.commentTextInput}
            placeholder="Comentar..."
            placeholderTextColor={COLORS.dim}
            value={text}
            onChangeText={setText}
            returnKeyType="send"
            onSubmitEditing={enviar}
          />
          {text.length > 0 && (
            <TouchableOpacity onPress={enviar} disabled={sending}>
              <Ionicons name="send" size={18} color={COLORS.lime} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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

function SistemaPost({ post }: { post: Post }) {
  return (
    <View style={styles.sistemaPost}>
      <Text style={styles.sistemaTexto}>{post.texto}</Text>
      <Text style={styles.sistemaTiempo}>{post.tiempo}</Text>
    </View>
  );
}

// ─── Post Composer ────────────────────────────────────────────────────────────

function PostComposer({ visible, onClose, onPublish }: {
  visible: boolean;
  onClose: () => void;
  onPublish: (text: string, photos: string[]) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canPost = (text.trim().length > 0 || photos.length > 0) && !saving;

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

  const handleClose = () => { if (saving) return; setText(''); setPhotos([]); onClose(); };

  const handlePublish = async () => {
    if (!canPost) return;
    setSaving(true);
    try {
      await onPublish(text.trim(), photos);
      setText('');
      setPhotos([]);
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo publicar. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

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
              onPress={handlePublish}
              disabled={!canPost}
            >
              {saving
                ? <ActivityIndicator size="small" color="#0f0f0f" />
                : <Text style={styles.composerPostBtnText}>Publicar</Text>
              }
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

const uploadGroupPostPhoto = async (uri: string, groupId: string, postId: string, index: number): Promise<string> => {
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = reject;
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
  const photoRef = storageRef(storage, `groups/${groupId}/posts/${postId}/${index}.jpg`);
  await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(photoRef);
};

function GroupDetail({ group, isMember, onBack }: { group: GroupDoc; isMember: boolean; onBack: () => void }) {
  const navigation = useNavigation<any>();
  const { firebaseUser, userDoc } = useAuth();
  const [tab, setTab] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState<GroupPostDoc[]>([]);
  const [members, setMembers] = useState<GroupMemberDoc[]>([]);
  const [torneos, setTorneos] = useState<TournamentDoc[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [joining, setJoining] = useState(false);

  const pagerRef = useRef<PagerView>(null);
  const tabRef = useRef(0);

  // Las reglas solo dejan leer posts a miembros — no suscribirse si no lo sos.
  useEffect(() => {
    if (!isMember) { setPosts([]); return; }
    const q = query(collection(db, 'groups', group.id, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ ...d.data(), id: d.id }) as GroupPostDoc)));
  }, [group.id, isMember]);

  useEffect(() => {
    if (!isMember) { setTorneos([]); return; }
    const q = query(collection(db, 'tournaments'), where('groupId', '==', group.id));
    return onSnapshot(q, snap => setTorneos(snap.docs.map(d => ({ ...d.data(), id: d.id }) as TournamentDoc)));
  }, [group.id, isMember]);

  // Miembros: legibles por cualquiera si es club, solo por miembros si es privado.
  useEffect(() => {
    if (!isMember && group.type !== 'club') { setMembers([]); return; }
    return onSnapshot(collection(db, 'groups', group.id, 'members'), snap =>
      setMembers(snap.docs.map(d => d.data() as GroupMemberDoc))
    );
  }, [group.id, isMember]);

  const handleTabPress = (i: number) => {
    setTab(i); tabRef.current = i;
    pagerRef.current?.setPage(i);
  };

  // Like local (visual) por ahora — persistirlo llega con su propia subcolección más adelante.
  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleJoin = async () => {
    if (!userDoc || joining) return;
    setJoining(true);
    try {
      await joinGroup(group.id, userDoc);
      // La snapshot de "mis grupos" del padre actualiza isMember sola.
    } catch {
      Alert.alert('Error', 'No te pudimos sumar al grupo. Probá de nuevo.');
    } finally {
      setJoining(false);
    }
  };

  const publicar = async (text: string, photoUris: string[]) => {
    if (!firebaseUser || !userDoc) return;
    const postRef = doc(collection(db, 'groups', group.id, 'posts'));
    const photoUrls = await Promise.all(photoUris.map((uri, i) => uploadGroupPostPhoto(uri, group.id, postRef.id, i)));
    const authorInitials = userDoc.displayName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    await setDoc(postRef, {
      id: postRef.id,
      authorId: firebaseUser.uid,
      authorName: userDoc.displayName,
      authorInitials,
      kind: photoUrls.length > 0 ? 'fotos' : 'texto',
      text: text || null,
      photos: photoUrls.length > 0 ? photoUrls : null,
      price: null,
      eventDate: null,
      eventLocation: null,
      attendeesCount: null,
      pinned: false,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'groups', group.id), { lastActivityAt: serverTimestamp() });
  };

  const TABS = ['Actividad', 'Torneos', 'Participantes'];

  // Adapta el doc real de Firestore a la forma que esperan los componentes de post.
  const toPost = (p: GroupPostDoc): Post => ({
    id: p.id,
    tipo: p.kind === 'fotos' ? 'fotos' : p.kind === 'sistema' ? 'sistema' : 'texto',
    autor: p.authorName,
    initials: p.authorInitials,
    bg: '#1a2a0a',
    color: COLORS.lime,
    tiempo: formatTs(p.createdAt),
    texto: p.text ?? undefined,
    fotos: p.photos ?? undefined,
    likes: p.likesCount + (likedIds.has(p.id) ? 1 : 0),
    liked: likedIds.has(p.id),
    comentarios: p.commentsCount,
    pinned: p.pinned,
  });

  const renderPost = (postDoc: GroupPostDoc) => {
    const post = toPost(postDoc);
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
      <PostComposer visible={showComposer} onClose={() => setShowComposer(false)} onPublish={publicar} />
      {commentsPost && (
        <CommentsSheet
          visible={!!commentsPost}
          onClose={() => setCommentsPost(null)}
          count={commentsPost.comentarios}
          groupId={group.id}
          postId={commentsPost.id}
        />
      )}

      {/* Nav fija */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{group.name}</Text>
        {!isMember && group.type === 'club' && (
          <TouchableOpacity style={styles.joinBtnSmall} onPress={handleJoin} disabled={joining}>
            {joining
              ? <ActivityIndicator size="small" color="#0f0f0f" />
              : <Text style={styles.joinBtnSmallText}>Unirse</Text>
            }
          </TouchableOpacity>
        )}
        {isMember && tab === 1 && (
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => navigation.navigate('CreateTorneo', { grupoFijoId: group.id, grupoFijoNombre: group.name })}>
            <Ionicons name="add" size={24} color={COLORS.lime} />
          </TouchableOpacity>
        )}
      </View>

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
            {!isMember
              ? <Text style={styles.emptyTabText}>Unite al grupo para ver la actividad.</Text>
              : posts.length === 0
                ? <Text style={styles.emptyTabText}>Todavía no hay actividad. ¡Publicá lo primero!</Text>
                : posts.map(renderPost)
            }
          </ScrollView>

          <ScrollView key="1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {torneos.length === 0 ? (
              <Text style={styles.emptyTabText}>Todavía no hay torneos en este grupo.</Text>
            ) : torneos.map(t => {
              const estado = estadoDeTorneo(t.roundDates);
              return (
                <TouchableOpacity key={t.id} style={styles.torneoRow} onPress={() => navigation.navigate('TorneoDetail', { torneoId: t.id })}>
                  <View style={[styles.torneoEstadoDot, estado === 'próximo' ? styles.torneoEstadoDotNext : styles.torneoEstadoDotDone]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.torneoNombre}>{t.name}</Text>
                    <Text style={styles.torneoMeta}>{t.modality} · {formatFechaTorneo(t.roundDates)}</Text>
                  </View>
                  <View style={estado === 'próximo' ? styles.torneoBadgeNext : styles.torneoBadgeDone}>
                    <Text style={estado === 'próximo' ? styles.torneoBadgeNextText : styles.torneoBadgeDoneText}>
                      {estado === 'próximo' ? 'Próximo' : estado === 'en curso' ? 'En curso' : 'Finalizado'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView key="2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {members.find(m => m.uid === firebaseUser?.uid)?.role === 'admin' && (
              <TouchableOpacity
                style={styles.addMemberRow}
                onPress={() => navigation.navigate('AgregarMiembros', { groupId: group.id, groupName: group.name })}
              >
                <View style={styles.addMemberIcon}>
                  <Ionicons name="person-add-outline" size={18} color={COLORS.lime} />
                </View>
                <Text style={styles.addMemberText}>Agregar participantes</Text>
              </TouchableOpacity>
            )}
            {members.length === 0
              ? <Text style={styles.emptyTabText}>{isMember || group.type === 'club' ? 'Sin participantes todavía.' : 'Unite al grupo para ver los participantes.'}</Text>
              : members.map(m => {
                  const initials = m.displayName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  const esYo = m.uid === firebaseUser?.uid;
                  return (
                    <TouchableOpacity
                      key={m.uid}
                      style={styles.row}
                      onPress={() => esYo
                        ? navigation.navigate('Tabs', { screen: 'Perfil' })
                        : navigation.navigate('PerfilUsuario', { viewUser: { name: m.displayName, initials, bg: COLORS.lime, color: '#0f0f0f', handicap: m.handicap ?? undefined } })
                      }
                    >
                      <Avatar initials={initials} bg={COLORS.lime} color="#0f0f0f" size={46} />
                      <View style={styles.rowInfo}>
                        <View style={styles.rowNameRow}>
                          <Text style={styles.rowName}>{m.displayName}{esYo ? ' (vos)' : ''}</Text>
                          {m.role === 'admin' && (
                            <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
                          )}
                        </View>
                        <Text style={styles.rowSub}>{m.handicap != null ? `HCP ${m.handicap}` : 'Sin handicap'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
            }
          </ScrollView>
        </PagerView>

        {isMember && tab === 0 && (
          <TouchableOpacity style={styles.fab} onPress={() => setShowComposer(true)}>
            <Ionicons name="add" size={26} color="#0f0f0f" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Modales ──────────────────────────────────────────────────────────────────

// ─── Rows ─────────────────────────────────────────────────────────────────────

function GroupRow({ group, isMember, onPress }: { group: GroupDoc; isMember: boolean; onPress: () => void }) {
  const visual = groupVisual(group);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Avatar initials={visual.initials} bg={visual.bg} color={visual.color} size={46} />
      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <Text style={styles.rowName}>{group.name}</Text>
          {isMember && <Ionicons name="checkmark-circle" size={15} color={COLORS.lime} />}
        </View>
        <Text style={styles.rowSub}>{group.membersCount} {group.membersCount === 1 ? 'miembro' : 'miembros'} · {group.type === 'club' ? 'Club' : 'Privado'} · {formatTs(group.lastActivityAt)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

function PlayerRow({ user }: { user: UserDoc }) {
  const navigation = useNavigation<any>();
  const [following, setFollowing] = useState(false);
  const initials = user.displayName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
        onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: user.displayName, initials, bg: COLORS.lime, color: '#0f0f0f', handicap: user.handicap ?? undefined } })}
      >
        <Avatar initials={initials} bg={COLORS.lime} color="#0f0f0f" size={46} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{user.displayName}</Text>
          <Text style={styles.rowSub}>@{user.username}{user.handicap != null ? ` · HCP ${user.handicap}` : ''}</Text>
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
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<GroupDoc[]>([]);
  const [clubs, setClubs] = useState<GroupDoc[]>([]);
  const [usuarios, setUsuarios] = useState<UserDoc[]>([]);

  // Jugadores registrados (hasta 50 por ahora).
  useEffect(() => {
    getDocs(query(collection(db, 'users'), limit(50)))
      .then(snap => setUsuarios(snap.docs.map(d => d.data() as UserDoc)))
      .catch(() => {});
  }, []);

  // Mis grupos (privados y clubes a los que me sumé).
  useEffect(() => {
    if (!firebaseUser) { setMyGroups([]); return; }
    const qMine = query(collection(db, 'groups'), where('memberUids', 'array-contains', firebaseUser.uid));
    return onSnapshot(qMine, snap => {
      const groups = snap.docs.map(d => ({ ...d.data(), id: d.id }) as GroupDoc);
      groups.sort((a, b) => (b.lastActivityAt?.toMillis?.() ?? 0) - (a.lastActivityAt?.toMillis?.() ?? 0));
      setMyGroups(groups);
    });
  }, [firebaseUser?.uid]);

  // Clubes públicos (para descubrirlos en la búsqueda).
  useEffect(() => {
    const qClubs = query(collection(db, 'groups'), where('type', '==', 'club'));
    return onSnapshot(qClubs, snap => setClubs(snap.docs.map(d => ({ ...d.data(), id: d.id }) as GroupDoc)));
  }, []);

  const myGroupIds = new Set(myGroups.map(g => g.id));
  const allGroups = [...myGroups, ...clubs.filter(c => !myGroupIds.has(c.id))];

  const q = search.toLowerCase();
  const filteredGroups = allGroups.filter(g => g.name.toLowerCase().includes(q));
  const filteredPlayers = usuarios.filter(u =>
    u.uid !== firebaseUser?.uid &&
    (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
  );
  const isSearching = search.length > 0;

  // Buscamos el grupo por id en la data viva para que el detalle se actualice con las snapshots.
  const selectedGroup = selectedGroupId ? allGroups.find(g => g.id === selectedGroupId) ?? null : null;

  if (selectedGroup) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GroupDetail
          group={selectedGroup}
          isMember={myGroupIds.has(selectedGroup.id)}
          onBack={() => setSelectedGroupId(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
                <GroupRow key={g.id} group={g} isMember={myGroupIds.has(g.id)} onPress={() => setSelectedGroupId(g.id)} />
              ))}
            </View>
          </>
        )}

        {isSearching && filteredPlayers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Jugadores</Text>
            <View style={styles.list}>
              {filteredPlayers.map(u => <PlayerRow key={u.uid} user={u} />)}
            </View>
          </>
        )}

        {isSearching && filteredGroups.length === 0 && filteredPlayers.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
          </View>
        )}

        <TouchableOpacity style={styles.createGroupBtn} onPress={() => navigation.navigate('CreateGrupo')}>
          <View style={styles.createGroupIcon}>
            <Ionicons name="add" size={20} color={COLORS.lime} />
          </View>
          <Text style={styles.createGroupBtnText}>Crear grupo</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Tus grupos</Text>
        <View style={styles.list}>
          {myGroups.length === 0
            ? <Text style={styles.emptyTabText}>Todavía no estás en ningún grupo. Creá uno o buscá un club.</Text>
            : myGroups.map(g => (
                <GroupRow key={g.id} group={g} isMember onPress={() => setSelectedGroupId(g.id)} />
              ))
          }
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
  emptyTabText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 32, paddingHorizontal: 32, lineHeight: 19 },
  addMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  addMemberIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1a2a0a', alignItems: 'center', justifyContent: 'center' },
  addMemberText: { fontSize: 15, fontWeight: '600', color: COLORS.lime },
  adminBadge: { backgroundColor: '#1a2a0a', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  adminBadgeText: { fontSize: 10, color: COLORS.lime, fontWeight: '700' },

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
  commentsEmpty: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
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
  torneoBadgeDone: { backgroundColor: '#222', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  torneoBadgeDoneText: { fontSize: 11, fontWeight: '700', color: COLORS.muted },

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
