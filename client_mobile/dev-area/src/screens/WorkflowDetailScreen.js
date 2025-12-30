import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Animated, PanResponder } from 'react-native';
import { ArrowLeft, Play, Settings } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import WorkflowNode from '../components/WorkflowNode';
import { LinearGradient } from 'expo-linear-gradient';

import { initialData } from '../data/mockData';

const ITEM_HEIGHT = 100;

const DraggableItem = ({ item, index, onDragStart, onDragMove, onDragEnd, isDragging, displacement }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(1)).current;
    const shift = useRef(new Animated.Value(0)).current; // Visual shift for virtual reorder
    const longPressTimer = useRef(null);
    const isLongPressActive = useRef(false);

    // Keep track of latest props to avoid stale closures in PanResponder
    const funcs = useRef({ onDragStart, onDragMove, onDragEnd });
    useEffect(() => {
        funcs.current = { onDragStart, onDragMove, onDragEnd };
    });

    // Handle displacement animation (when other items need to move)
    React.useEffect(() => {
        Animated.spring(shift, {
            toValue: displacement * ITEM_HEIGHT,
            useNativeDriver: true,
            friction: 20,
            tension: 200,
        }).start();
    }, [displacement]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                if (isLongPressActive.current) return true;
                if (Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10) {
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                    return false;
                }
                return false;
            },
            onPanResponderGrant: () => {
                pan.setOffset({ x: 0, y: 0 });
                pan.setValue({ x: 0, y: 0 });

                longPressTimer.current = setTimeout(() => {
                    isLongPressActive.current = true;
                    isLongPressActive.current = true;
                    if (funcs.current.onDragStart) {
                        funcs.current.onDragStart(item.id);
                    }
                    Animated.spring(scale, {
                        toValue: 1.05,
                        useNativeDriver: true,
                    }).start();
                }, 300);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (isLongPressActive.current) {
                    pan.setValue({ x: 0, y: gestureState.dy });
                    if (isLongPressActive.current) {
                        pan.setValue({ x: 0, y: gestureState.dy });
                        if (funcs.current.onDragMove) {
                            funcs.current.onDragMove(gestureState.dy);
                        }
                    }
                }
            },
            onPanResponderRelease: () => {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }

                if (isLongPressActive.current) {
                    pan.flattenOffset();
                    Animated.parallel([
                        Animated.spring(pan, {
                            toValue: { x: 0, y: 0 },
                            useNativeDriver: true,
                        }),
                        Animated.spring(scale, {
                            toValue: 1,
                            useNativeDriver: true,
                        }),
                    ]).start();

                    if (funcs.current.onDragEnd) {
                        funcs.current.onDragEnd();
                    }
                }

                isLongPressActive.current = false;
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.itemContainer,
                {
                    transform: [
                        { translateY: isDragging ? pan.y : shift }, // Use pan for dragged, shift for others
                        { scale: scale },
                    ],
                    zIndex: isDragging ? 100 : 1,
                    opacity: isDragging ? 0.9 : 1,
                },
            ]}
            {...panResponder.panHandlers}
        >
            <WorkflowNode
                type={item.type}
                title={item.title}
                subtitle={item.subtitle}
                status={item.status}
                isStart={item.isStart}
                isEnd={item.isEnd}
            />
        </Animated.View>
    );
};

const WorkflowDetailScreen = ({ navigation, route }) => {
    const { title } = route.params || { title: "New Workflow" };
    const [data, setData] = useState(initialData);
    const [draggingId, setDraggingId] = useState(null);
    const [dragState, setDragState] = useState({ srcIndex: null, destIndex: null });
    const [scrollEnabled, setScrollEnabled] = useState(true);

    const handleDragStart = (itemId) => {
        const index = data.findIndex(item => item.id === itemId);
        setDraggingId(itemId);
        setDragState({ srcIndex: index, destIndex: index });
        setScrollEnabled(false);
    };

    const handleDragMove = (itemId, dy) => {
        if (!draggingId || dragState.srcIndex === null) return;

        const srcIndex = dragState.srcIndex;
        // Calculate the theoretical new index based on drag distance
        const movedSteps = Math.round(dy / ITEM_HEIGHT);
        const nextIndex = Math.max(0, Math.min(data.length - 1, srcIndex + movedSteps));

        if (nextIndex !== dragState.destIndex) {
            setDragState(prev => ({ ...prev, destIndex: nextIndex }));
        }
    };

    const handleDragEnd = () => {
        if (dragState.srcIndex !== null && dragState.destIndex !== null && dragState.srcIndex !== dragState.destIndex) {
            const newData = [...data];
            const [item] = newData.splice(dragState.srcIndex, 1);
            newData.splice(dragState.destIndex, 0, item);
            setData(newData);
        }

        setDraggingId(null);
        setDragState({ srcIndex: null, destIndex: null });
        setScrollEnabled(true);
    };

    const getDisplacement = (index) => {
        if (!draggingId) return 0;
        const { srcIndex, destIndex } = dragState;

        // The dragged item itself doesn't use displacement (it uses pan)
        if (index === srcIndex) return 0;

        // Items between src and dest need to shift
        if (srcIndex < destIndex) {
            // Dragged down: items in between move UP
            if (index > srcIndex && index <= destIndex) return -1;
        } else if (srcIndex > destIndex) {
            // Dragged up: items in between move DOWN
            if (index >= destIndex && index < srcIndex) return 1;
        }
        return 0;
    };

    return (
        <GradientBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
                        <Text style={styles.statusText}>ACTIVE</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.settingsButton}>
                    <Settings color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.controlBar}>
                <Text style={styles.controlLabel}>Workflow Status</Text>
                <Switch
                    value={true}
                    trackColor={{ false: "#334155", true: "#2563eb" }}
                    thumbColor={"#fff"}
                />
            </View>



            <ScrollView
                scrollEnabled={scrollEnabled}
                contentContainerStyle={styles.canvas}
                showsVerticalScrollIndicator={false}
            >
                {data.map((item, index) => (
                    <DraggableItem
                        key={item.id}
                        item={item}
                        index={index}
                        isDragging={draggingId === item.id}
                        displacement={getDisplacement(index)}
                        onDragStart={() => handleDragStart(item.id)}
                        onDragMove={(dy) => handleDragMove(item.id, dy)}
                        onDragEnd={handleDragEnd}
                    />
                ))}

                <TouchableOpacity style={styles.addNodeButton}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                        style={styles.addNodeGradient}
                    >
                        <Text style={styles.addNodeText}>+ Add Node</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.toolbar}>
                    <TouchableOpacity style={styles.toolBtn}>
                        <Settings color="#94a3b8" size={20} />
                        <Text style={styles.toolText}>Config</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.runButton}>
                    <LinearGradient
                        colors={['#2563eb', '#1d4ed8']}
                        style={styles.runGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Play fill="#fff" color="#fff" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.runText}>Test Run</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBar: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    controlLabel: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600',
    },
    hintContainer: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    hintText: {
        color: '#93c5fd',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },
    canvas: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    itemContainer: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
    },
    addNodeButton: {
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    addNodeGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        borderRadius: 20,
    },
    addNodeText: {
        color: '#fff',
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#020617',
        borderRadius: 24,
        flexDirection: 'row',
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 10,
    },
    toolbar: {
        flex: 1,
        flexDirection: 'row',
        paddingLeft: 10,
        alignItems: 'center',
    },
    toolBtn: {
        alignItems: 'center',
        marginRight: 20,
    },
    toolText: {
        color: '#94a3b8',
        fontSize: 10,
        marginTop: 2,
    },
    runButton: {
        flex: 1.5,
    },
    runGradient: {
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
    },
    runText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default WorkflowDetailScreen;
