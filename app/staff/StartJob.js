import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const StartJob = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params || {};
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const startTimer = () => {
    if (!running) {
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stopTimer = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // TODO: Save/submit job completion
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const plannedSeconds = (booking?.planned_hours ? parseFloat(booking.planned_hours) : 2) * 3600;
  const progress = Math.min(timer / plannedSeconds, 1);

  const getDay = (dateStr) => {
    if (!dateStr) return '';
    return moment(dateStr).format('dddd, DD MMM YYYY');
  };
  const getTime = (dateStr) => {
    if (!dateStr) return '';
    return moment(dateStr).format('HH:mm');
  };
  const getDuration = (start, end) => {
    if (!start || !end) return '';
    const diff = moment(end).diff(moment(start), 'minutes');
    const h = Math.floor(diff / 60).toString().padStart(2, '0');
    const m = (diff % 60).toString().padStart(2, '0');
    return `${h}:${m} h`;
  };
  console.log('StartJob rendered with booking:', booking);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#c7e2fc' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 28 }} />
      </View>
      {/* Map Placeholder + In Progress Badge
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Job Location Map</Text>
        <View style={styles.inProgressBadge}>
          <Text style={styles.inProgressText}>At Work</Text>
        </View>
      </View> */}
      {/* Timer Section */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>
          {getDay(booking?.start_time)}  {getTime(booking?.start_time)} → {getTime(booking?.end_time)} Hours
        </Text>
        <Text style={styles.timerValue}>{formatTime(timer)}</Text>
        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timerControls}>
          <TouchableOpacity style={styles.pauseBtn} onPress={pauseTimer} disabled={!running}>
            <Ionicons name="pause" size={28} color="#334eb8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopBtn} onPress={stopTimer}>
            {/*<Ionicons name="stop" size={28} color="#fff" />*/}
            <Text style={styles.stopBtn}>Check Out</Text>
          </TouchableOpacity>
        </View>
        {!running ? (
          <TouchableOpacity style={styles.startBtn} onPress={startTimer}>
            <Text style={styles.startBtnText}>Check In</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {/* Info Panel at Bottom */}
      <View style={styles.infoPanel}>
        {/* Tabs (Details, Dokumentation, Material) */}
        <View style={styles.tabsRow}>
          <Text style={[styles.tabText, styles.tabActive]}>Details</Text>
          {/* <Text style={styles.tabText}>Compliance</Text>*/}
          <Text style={styles.tabText}>Report</Text>
        </View>
        {/* Info Rows */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={22} color="#334eb8" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Shift hours</Text>
            <Text style={styles.infoValue}>{getDuration(booking?.start_time, booking?.end_time)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={22} color="#334eb8" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Day</Text>
            <Text style={styles.infoValue}>{getDay(booking?.start_time)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={22} color="#334eb8" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Adresse</Text>
            <Text style={styles.infoValue}>{booking?.address || 'No Address Provided'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#b0b6c3" />
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="campaign" size={22} color="#334eb8" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{booking?.description || 'No description provided.'}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#123456',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 80,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#e6edff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginHorizontal: 0,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapText: {
    color: '#334eb8',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inProgressBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e6f0fa',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  inProgressText: {
    color: '#334eb8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  timerLabel: {
    color: '#888',
    fontSize: 15,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#334eb8',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '80%',
    height: 6,
    backgroundColor: '#e6edff',
    borderRadius: 3,
    marginBottom: 18,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#334eb8',
    borderRadius: 3,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playBtn: {
    backgroundColor: '#334eb8',
    borderRadius: 32,
    padding: 16,
    marginRight: 16,
  },
  pauseBtn: {
    backgroundColor: '#e6edff',
    borderRadius: 32,
    padding: 16,
    marginRight: 16,
  },
  stopBtn: {
    backgroundColor: '#e53935',
    borderRadius: 24,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: 'bold',
  },
  startBtn: {
    marginTop: 12,
    backgroundColor: '#334eb8',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoPanel: {
    top: 400,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 16,
    color: '#b0b6c3',
    fontWeight: 'bold',
    marginRight: 24,
    paddingBottom: 8,
  },
  tabActive: {
    color: '#334eb8',
    borderBottomWidth: 2,
    borderBottomColor: '#334eb8',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  infoIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  infoLabel: {
    color: '#b0b6c3',
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
    flexWrap: 'wrap',
    maxWidth: '95%',
  },
});

export default StartJob;
