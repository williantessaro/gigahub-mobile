import java.io.File;
import java.net.URI;
import java.nio.file.*;
import java.util.*;

public class UpdateApk {
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("Uso: java UpdateApk.java <caminho-apk> <diretorio-assets-novos>");
            System.exit(1);
        }

        File apkFile = new File(args[0]).getAbsoluteFile();
        File newAssetsDir = new File(args[1]).getAbsoluteFile();

        URI uri = URI.create("jar:" + apkFile.toURI());
        Map<String, String> env = new HashMap<>();
        env.put("create", "false");

        try (FileSystem fs = FileSystems.newFileSystem(uri, env)) {
            // 1. Remover assinaturas antigas em META-INF para evitar SecurityException no jarsigner
            Path metaInf = fs.getPath("/META-INF");
            if (Files.exists(metaInf)) {
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(metaInf)) {
                    for (Path p : stream) {
                        String name = p.getFileName().toString().toUpperCase();
                        if (name.endsWith(".SF") || name.endsWith(".RSA") || name.endsWith(".DSA") || name.equals("MANIFEST.MF")) {
                            Files.delete(p);
                            System.out.println("Removida assinatura antiga: " + p);
                        }
                    }
                }
            }

            // 2. Limpar arquivos antigos de assets/public/
            Path assetsPublic = fs.getPath("/assets/public");
            if (Files.exists(assetsPublic)) {
                deleteRecursively(assetsPublic);
            }
            Files.createDirectories(assetsPublic);

            // 3. Copiar todos os novos arquivos para /assets/public
            Path sourceRoot = newAssetsDir.toPath();
            Files.walk(sourceRoot).forEach(source -> {
                try {
                    Path rel = sourceRoot.relativize(source);
                    if (rel.toString().isEmpty()) return;

                    Path target = assetsPublic.resolve(rel.toString().replace("\\", "/"));
                    if (Files.isDirectory(source)) {
                        if (!Files.exists(target)) {
                            Files.createDirectories(target);
                        }
                    } else {
                        if (target.getParent() != null && !Files.exists(target.getParent())) {
                            Files.createDirectories(target.getParent());
                        }
                        Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
                        System.out.println("Copiado para APK: " + target);
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

            // 3.5 Garantir cordova.js e cordova_plugins.js
            Path cordovaJs = assetsPublic.resolve("cordova.js");
            if (!Files.exists(cordovaJs)) {
                Files.createFile(cordovaJs);
                System.out.println("Criado cordova.js vazio para compatibilidade Capacitor");
            }
            Path cordovaPluginsJs = assetsPublic.resolve("cordova_plugins.js");
            if (!Files.exists(cordovaPluginsJs)) {
                Files.createFile(cordovaPluginsJs);
                System.out.println("Criado cordova_plugins.js vazio para compatibilidade Capacitor");
            }

            // 4. Copiar capacitor.config.json para /assets/capacitor.config.json
            File capConfig = new File(newAssetsDir.getParentFile(), "capacitor.config.json");
            if (capConfig.exists()) {
                Path capTarget = fs.getPath("/assets/capacitor.config.json");
                Files.copy(capConfig.toPath(), capTarget, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("Atualizado: /assets/capacitor.config.json");
            }
        }

        System.out.println("Sucesso: Arquivos empacotados no APK.");
    }

    private static void deleteRecursively(Path root) throws Exception {
        if (!Files.exists(root)) return;
        Files.walk(root)
            .sorted(Comparator.reverseOrder())
            .forEach(p -> {
                try {
                    if (!p.equals(root)) {
                        Files.delete(p);
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
    }
}
