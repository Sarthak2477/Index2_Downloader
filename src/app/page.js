import Image from "next/image";
import styles from "./page.module.css";
import SearchForm from "./components/SearchForm";

export default function Home() {
  return (
    <div className={styles.page}>
      <SearchForm/>       
    </div>
  );
}
