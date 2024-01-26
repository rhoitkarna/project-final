import React, { useState } from 'react';
import {
  SafeAreaView,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  Platform,
  Dimensions,
  useColorScheme,
  View,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import PermissionsService, { isIOS } from './Permissions';

// Importing images
import background from './images/background.jpg';
import clean from './images/clean.png';
import camera from './images/camera.png';
import gallery from './images/gallery.png';

axios.interceptors.request.use(
  async (config) => {
    let request = config;
    request.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    request.url = configureUrl(config.URL);
    return request;
  },
  (error) => error
);


export const { height, width } = Dimensions.get('window');

export const configureUrl = (url) => {
  let authUrl = url;
  if (url && url[url.length - 1] === '/') {
    authUrl = url.substring(0, url.length - 1);
  }
  return authUrl;
};

export const fonts = {
  Bold: { fontFamily: 'Roboto-Bold' },
};

const options = {
  mediaType: 'photo',
  quality: 1,
  width: 256,
  height: 256,
  includeBase64: true,
};

const App = () => {
  const [result, setResult] = useState('');
  const [label, setLabel] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const [image, setImage] = useState('');
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

//   const getPredication = async (params) => {
//     return new Promise((resolve, reject) => {
//       var bodyFormData = new FormData();
//       bodyFormData.append('file', params);
//       const url = Config.URL;
//       return axios
//         .post(url, bodyFormData)
//         .then((response) => {
//           resolve(response);
//         })
//         .catch((error) => {
//           setLabel('Failed to predict.');
//           reject('err', error);
//         });
//     });
//   };

const getPredication = async (params) => {
console.log("Getting predictions")
  return new Promise((resolve, reject) => {
    var bodyFormData = new FormData();
    bodyFormData.append('file', params);
    const url = "http://localhost:8000/predict";
    console.log("Url", url)
    // Specify headers for this request
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

//     return axios
//       .post("http://192.168.1.75:8000/predict", bodyFormData, config)
//       .then((response) => {
//         console.log("Res", response)
//         resolve(response);
//       })
//       .catch((error) => {
//       console.log("Error Res", error)
//         setLabel('Failed to predict.');
//         reject('err', error);
//       });

      return fetch("http://192.168.1.75:8000/predict", {
        method: "POST",
        headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: bodyFormData
      }).then((response) => {
                console.log("Res", response)
                resolve(response.json());
              })
              .catch((error) => {
              console.log("Error Res", error)
                setLabel('Failed to predict.');
                reject('err', error);
              });
  });
};



  const manageCamera = async (type) => {
    try {
      if (!(await PermissionsService.hasCameraPermission())) {
        return [];
      } else {
        if (type === 'Camera') {
          openCamera();
        } else {
          openLibrary();
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const openCamera = async () => {
    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const uri = response?.assets[0]?.uri;
        const path = Platform.OS !== 'ios' ? uri : 'file://' + uri;
        getResult(path, response);
      }
    });
  };

  const clearOutput = () => {
    setResult('');
    setImage('');
  };

  const getResult = async (path, response) => {
    setImage(path);
    setLabel('Predicting...');
    setResult('');
    const params = {
      uri: path,
      name: response.assets[0].fileName,
      type: response.assets[0].type,
    };
    const res = await getPredication(params);
    console.log("Response from getresult", res)

    function toTitleCase(str) {
      return str.replace(
        /\w\S*/g,
        function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
      );
    }
    if (res?.class) {
    prediction = res.class;
    disease = prediction.split("_").join(" ")
      setLabel(toTitleCase(disease));
      setResult(res.confidence * 100);
    } else {
      setLabel('Failed to predict');
    }
  };

  const openLibrary = async () => {
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const uri = response.assets[0].uri;
        const path = Platform.OS !== 'ios' ? uri : 'file://' + uri;
        getResult(path, response);
      }
    });
  };

  return (
    <View style={[backgroundStyle, styles.outer]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ImageBackground blurRadius={10} source={background} style={{ height: height, width: width }} />
      <Text style={styles.title}>{'FarmEasy: Paddy\nDisease Detection'}</Text>
      <TouchableOpacity onPress={clearOutput} style={styles.clearStyle}>
        <Image source={clean} style={styles.clearImage} />
      </TouchableOpacity>
      {(image?.length && <Image source={{ uri: image }} style={styles.imageStyle} />) || null}
      {(result && label && (
        <View style={styles.mainOuter}>
          <Text style={[styles.space, styles.labelText]}>
            {'Label: \n'}
            <Text style={styles.resultText}>{label}</Text>
          </Text>
          <Text style={[styles.space, styles.labelText]}>
            {'Confidence: \n'}
            <Text style={styles.resultText}>{parseFloat(result).toFixed(2) + '%'}</Text>
          </Text>
        </View>
      )) ||
        (image && <Text style={styles.emptyText}>{label}</Text>) || (
          <Text style={styles.emptyText}>
            Use below buttons to select a picture of a paddy plant leaf.
          </Text>
        )}
      <View style={styles.btn}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => manageCamera('Camera')} style={styles.btnStyle}>
          <Image source={camera} style={styles.imageIcon} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.9} onPress={() => manageCamera('Photo')} style={styles.btnStyle}>
          <Image source={gallery} style={styles.imageIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    alignSelf: 'center',
    position: 'absolute',
    top: (isIOS && 35) || 10,
    fontSize: 30,
    ...fonts.Bold,
    color: '#FFF',
  },
  clearImage: { height: 40, width: 40, tintColor: '#FFF' },
  mainOuter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: height / 1.6,
    alignSelf: 'center',
  },
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    position: 'absolute',
    bottom: 40,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  btnStyle: {
    backgroundColor: '#FFF',
    opacity: 0.8,
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 20,
  },
  imageStyle: {
    marginBottom: 50,
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: 20,
    position: 'absolute',
    borderWidth: 0.3,
    borderColor: '#FFF',
    top: height / 4.5,
  },
  clearStyle: {
    position: 'absolute',
    top: 100,
    right: 30,
    tintColor: '#FFF',
    zIndex: 10,
  },
  space: { marginVertical: 10, marginHorizontal: 10 },
  labelText: { color: '#FFF', fontSize: 20, ...fonts.Bold },
  resultText: { fontSize: 32, ...fonts.Bold },
  imageIcon: { height: 40, width: 40, tintColor: '#000' },
  emptyText: {
    position: 'absolute',
    top: height / 1.6,
    alignSelf: 'center',
    color: '#FFF',
    fontSize: 20,
    maxWidth: '70%',
    ...fonts.Bold,
  },
});

export default App;
