import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Button, View } from "react-native";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";

// アプリがフォアグラウンドに表示されていても通知を表示する設定
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
    };
  },
});

export default function App() {
  const [pushToken, setPushToken] = useState();

  useEffect(() => {
    Permissions.getAsync(Permissions.NOTIFICATIONS)
      // ローカル通知の Permission 要請ここから
      .then((statusObj) => {
        if (statusObj.status !== "granted") {
          return Permissions.askAsync(Permissions.NOTIFICATIONS);
        }
        return statusObj;
      })
      .then((statusObj) => {
        if (statusObj.status !== "granted") {
          throw new Error("Permission not granted!");
        }
      })
      // ローカル通知の Permission 要請ここまで
      // 以下 Permissionが得られた場合のみ実行される
      // pushToken を取得する
      .then(() => {
        return Notifications.getExpoPushTokenAsync();
      })
      // pushToken を state に格納する
      .then((response) => {
        const token = response.data;
        setPushToken(token);
      })
      .catch((err) => {
        console.log(err);
        return null;
      });
  }, []);

  useEffect(() => {
    // アプリがバックグラウンドに表示されている際の通知のリスナー
    // 通知に対してユーザーがアクションを起こした際のレスポンスを受け取ることができる
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // ユーザーが通知をタップした際に特定のページにナビゲートしたり特定の処理を行ったりできる
        console.log(response);
      }
    );

    // アプリがフォアグラウンドに表示されている際の通知のリスナー
    // 通知が発生した際にその通知内容を表す notification オブジェクトを受け取ることができる
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(notification);
      }
    );

    return () => {
      // クリーンナップ
      backgroundSubscription.remove();
      foregroundSubscription.remove();
    };
  }, []);

  const triggerNotificationHandler = () => {
    // 以下 LocalNotification の例
    // Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: 'My first local notification',
    //     body: 'This is the first local notification we are sending!',
    //     data: { mySpecialData: 'Some text' },
    //   },
    //   trigger: {
    //     seconds: 10,
    //   },
    // });
    fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        data: { extraData: "Some data" },
        title: "Sent via the app",
        body: "This push notification was sent via the app!",
      }),
    });
  };

  return (
    <View style={styles.container}>
      <Button
        title="Trigger Notification"
        onPress={triggerNotificationHandler}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
