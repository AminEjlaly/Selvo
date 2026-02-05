import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ProgressBarAndroid,
  Platform,
} from "react-native";
import axios from "axios";
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";

const CURRENT_VERSION = "1.0.0"; // نسخه فعلی اپت (میتونی از package.json بگیری)
const API_URL = "https://your-server.com/api/app-version/"; // آدرس سرورت

export default function UpdateChecker() {
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const res = await axios.get(API_URL);
      const { latest_version, apk_url, changelog } = res.data;

      if (latest_version !== CURRENT_VERSION) {
        setUpdateInfo({ latest_version, apk_url, changelog });
        setVisible(true);
      }
    } catch (err) {
      console.warn("❌ Update check failed:", err.message);
    }
  };

  const startDownload = async () => {
    if (!updateInfo?.apk_url) return;

    setDownloading(true);
    const path = `${RNFS.DownloadDirectoryPath}/app-latest.apk`;

    const options = {
      fromUrl: updateInfo.apk_url,
      toFile: path,
      progress: (res) => {
        const pct = res.bytesWritten / res.contentLength;
        setProgress(pct);
      },
    };

    try {
      const result = await RNFS.downloadFile(options).promise;
      if (result.statusCode === 200) {
        await FileViewer.open(path); // نصب فایل
        setVisible(false);
      } else {
        console.warn("Download failed:", result.statusCode);
      }
    } catch (e) {
      console.warn("Download error:", e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>آپدیت جدید موجود است 🎉</Text>
          <Text style={styles.text}>{updateInfo?.changelog}</Text>

          {downloading ? (
            <>
              <Text style={styles.text}>در حال دانلود: {(progress * 100).toFixed(0)}%</Text>
              <ProgressBarAndroid
                styleAttr="Horizontal"
                indeterminate={false}
                progress={progress}
                color="#2196F3"
              />
            </>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={[styles.btn, { backgroundColor: "#ccc" }]}
              >
                <Text>بعداً</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={startDownload}
                style={[styles.btn, { backgroundColor: "#2196F3" }]}
              >
                <Text style={{ color: "#fff" }}>آپدیت کن</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontFamily: "IRANYekan-Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  text: {
    fontFamily: "IRANYekan",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
});
