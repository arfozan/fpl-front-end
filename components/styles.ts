import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#d45474ff',
    marginBottom: 16,
    elevation: 4, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  playerPhoto: {
    width: 80,
    height: 110,
    borderRadius: 5,
    marginRight: 12,
  },
  rightContent: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#ffffffff',
  },
  teamBid: {
    fontSize: 14,
    color: '#ffffffff',
    marginBottom: 4,
  },
  expiry: {
    fontSize: 12,
    color: '#f12222ff',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },

  homeContainer: {
    padding: 18,
    backgroundColor: '#ffffffff',
    elevation: 5, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  homeCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#2563eb", // blue-600
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  transferText: {
    marginTop: 4,
    fontWeight: "500",
    color: "green",
  },
});

export default styles;



