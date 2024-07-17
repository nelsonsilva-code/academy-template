import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar

var newRelicVersion = "8.7.0"

val externalDependencies by configurations.creating

plugins {
    id("org.springframework.boot") version "3.3.1"
    id("io.spring.dependency-management") version "1.1.3"
    id("com.github.johnrengelman.shadow") version "7.0.0"
    kotlin("jvm") version "1.8.22"
    kotlin("plugin.spring") version "1.8.22"
    id("jacoco")
}

group = "pt.com.vw.template"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-web") {
        exclude("commons-logging", "commons-logging")
    }
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.14.2")

    implementation("org.jetbrains.kotlin:kotlin-reflect")

    implementation("com.azure:azure-messaging-servicebus:7.13.3")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("com.google.guava:guava:31.1-jre")
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.5")
    implementation("com.amazonaws:aws-java-sdk-sqs:1.12.472") {
        exclude("commons-logging", "commons-logging")
    }
    implementation("org.springframework:spring-webflux:6.0.13")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("io.projectreactor.netty:reactor-netty")
    implementation("com.newrelic.agent.java:newrelic-api:$newRelicVersion")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testImplementation("io.mockk:mockk:1.13.4")
    testImplementation("org.mockito.kotlin:mockito-kotlin:4.1.0")

    externalDependencies("com.newrelic.agent.java:newrelic-agent:$newRelicVersion")

    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
}
tasks {
    withType<ShadowJar> { mergeServiceFiles() }
}
tasks.withType<ShadowJar> {
    into("agents") {
        from(externalDependencies) {
            rename("newrelic-agent-$newRelicVersion.jar", "newrelic-agent.jar")
        }
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += "-Xjsr305=strict"
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.test {
    finalizedBy("jacocoTestReport")
}
tasks.named<JacocoReport>("jacocoTestReport") {
    dependsOn("test")
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.named("compileJava") {
    inputs.files(tasks.named("processResources"))
}
